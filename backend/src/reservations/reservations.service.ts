import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { v4 as uuidv4 } from "uuid";
import { Reservation, ReservationStatus } from "./reservation.entity";
import { Vehicle, VehicleStatus } from "../vehicles/vehicle.entity";
import { User, UserRole } from "../users/user.entity";
import { CreateReservationDto } from "./dto/create-reservation.dto";
import { StripeService } from "../stripe/stripe.service";
import { QrService } from "../qr/qr.service";

// Fixed deposit: 10 EUR
const DEPOSIT_EUR_CENTS = 1000;

// Statuses that "block" a vehicle for a given date range
const BLOCKING_STATUSES = [
  ReservationStatus.PENDING_DEPOSIT,
  ReservationStatus.AWAITING_CAPTURE,
  ReservationStatus.CONFIRMED,
  ReservationStatus.IN_PROGRESS,
];

@Injectable()
export class ReservationsService {
  private readonly logger = new Logger(ReservationsService.name);

  constructor(
    @InjectRepository(Reservation)
    private readonly reservationsRepo: Repository<Reservation>,
    @InjectRepository(Vehicle)
    private readonly vehiclesRepo: Repository<Vehicle>,
    @InjectQueue("reservation-expiry")
    private readonly reservationExpiryQueue: Queue,
    private readonly dataSource: DataSource,
    private readonly stripeService: StripeService,
    private readonly qrService: QrService,
  ) {}

  /**
   * Creates a reservation using the 2-phase Saga pattern:
   *
   * PHASE 1 (inside DB transaction — ACID):
   *   1. Lock vehicle row with SELECT FOR UPDATE (prevents overbooking under concurrency)
   *   2. Verify no overlapping BLOCKING reservations exist
   *   3. Recalculate price server-side (Zero Trust — never trust client price)
   *   4. Create Stripe PaymentIntent (authorize only, capture_method:'manual')
   *   5. Save reservation with PENDING_DEPOSIT + stripePaymentIntentId
   *   6. Commit transaction
   *
   * PHASE 2 (outside DB transaction):
   *   - Return stripeClientSecret → frontend completes payment
   *   - Operator reviews documents → triggers AWAITING_CAPTURE transition
   *   - BullMQ capture-stripe processor captures the PI → CONFIRMED
   */
  async create(dto: CreateReservationDto, user: User): Promise<Reservation> {
    const pickupDate = new Date(dto.pickupDate);
    const returnDate = new Date(dto.returnDate);
    const now = new Date();

    // ── Date validation ──────────────────────────────────────
    if (isNaN(pickupDate.getTime()) || isNaN(returnDate.getTime())) {
      throw new BadRequestException("Fechas inválidas.");
    }

    if (pickupDate < now && process.env.BYPASS_STRIPE !== "true") {
      throw new BadRequestException("pickupDate no puede ser en el pasado.");
    }

    if (returnDate <= pickupDate) {
      throw new BadRequestException(
        "returnDate debe ser posterior a pickupDate.",
      );
    }

    const diffMs = returnDate.getTime() - pickupDate.getTime();
    // Bug 1 fix: Math.ceil ensures any partial day is billed as a full day
    // (industry standard for vehicle rentals)
    const totalDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (totalDays < 1) {
      throw new BadRequestException("El alquiler mínimo es 1 día.");
    }

    // ── Bug 2 fix: Pre-generate UUID for stable Stripe idempotency key ─
    const reservationUuid = uuidv4();

    // ── Run Saga Phase 1 in a DB transaction (no external HTTP calls) ──
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let reservation: Reservation;
    let pricePerDayEurCents: number;

    try {
      // 1. Lock the vehicle row (pessimistic write — prevents concurrent overbooking)
      const vehicle = await queryRunner.manager.getRepository(Vehicle).findOne({
        where: { id: dto.vehicleId },
        lock: { mode: "pessimistic_write" },
      });

      if (!vehicle) {
        throw new NotFoundException(`Vehículo ${dto.vehicleId} no encontrado.`);
      }

      // BUG-20 fix: Allow reservations for RENTED vehicles (future dates).
      // The overlap check below already prevents real date conflicts.
      // Only MAINTENANCE and INACTIVE should block booking entirely.
      if (
        vehicle.status === VehicleStatus.MAINTENANCE ||
        vehicle.status === VehicleStatus.INACTIVE
      ) {
        throw new ConflictException(
          "El vehículo no está disponible para alquiler.",
        );
      }

      // 2. Check for overlapping reservations (while holding vehicle lock)
      const overlapping = await queryRunner.manager
        .getRepository(Reservation)
        .createQueryBuilder("r")
        .where("r.vehicleId = :vehicleId", { vehicleId: dto.vehicleId })
        .andWhere("r.status IN (:...statuses)", { statuses: BLOCKING_STATUSES })
        .andWhere("r.pickupDate < :returnDate", { returnDate })
        .andWhere("r.returnDate > :pickupDate", { pickupDate })
        .getCount();

      if (overlapping > 0) {
        throw new ConflictException(
          "El vehículo ya está reservado para las fechas seleccionadas.",
        );
      }

      // 3. Server-side price calculation — NEVER trust client (Zero Trust mandate)
      pricePerDayEurCents = vehicle.pricePerDayEurCents;
      const totalPriceEurCents = pricePerDayEurCents * totalDays;

      // 4. Persist reservation WITHOUT Stripe data yet
      //    Bug 11 fix: Stripe PI is created OUTSIDE the transaction to avoid
      //    holding the pessimistic lock during an external HTTP call.
      reservation = queryRunner.manager.getRepository(Reservation).create({
        id: reservationUuid, // Bug 2 fix: pre-generated UUID
        userId: user.id,
        vehicleId: vehicle.id,
        pickupDate,
        returnDate,
        totalDays,
        totalPriceEurCents,
        depositEurCents: DEPOSIT_EUR_CENTS,
        pickupLocation: dto.pickupLocation,
        status: ReservationStatus.PENDING_DEPOSIT,
        stripePaymentIntentId: null,
        stripeClientSecret: null,
        customerName: dto.customerName ?? null,
        customerPhone: dto.customerPhone ?? null,
        qrCodeHash: null,
      });

      reservation = await queryRunner.manager
        .getRepository(Reservation)
        .save(reservation);

      // 5. Commit — vehicle availability is now "blocked" for these dates
      //    DB lock released here, BEFORE calling Stripe
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    // ── Phase 2 (outside transaction) — Stripe + BullMQ ─────────

    // Create Stripe PaymentIntent (no DB lock held during this HTTP call)
    // capture_method: 'manual' — only authorizes, does NOT charge yet
    let paymentIntent: { id: string; client_secret: string | null };
    const bypassStripe = process.env.BYPASS_STRIPE === "true";

    if (bypassStripe) {
      paymentIntent = {
        id: `pi_dev_mock_${Date.now()}`,
        client_secret: `pi_dev_mock_secret_${Date.now()}`,
      };
    } else {
      paymentIntent = await this.stripeService.createPaymentIntent(
        DEPOSIT_EUR_CENTS,
        reservationUuid, // Bug 2 fix: stable UUID as idempotency key
        {
          userId: user.id,
          vehicleId: reservation.vehicleId,
          totalDays: String(totalDays),
        },
      );
    }

    // Update reservation with Stripe data
    await this.reservationsRepo.update(
      { id: reservation.id },
      {
        stripePaymentIntentId: paymentIntent.id,
        stripeClientSecret: paymentIntent.client_secret,
      },
    );
    reservation.stripePaymentIntentId = paymentIntent.id;
    reservation.stripeClientSecret = paymentIntent.client_secret;

    // Enqueue expiry job: if still PENDING_DEPOSIT after 15 min → cancel
    await this.reservationExpiryQueue.add(
      "expire",
      { reservationId: reservation.id },
      {
        delay: 15 * 60 * 1000, // 15 minutes
        attempts: 3,
        backoff: { type: "exponential", delay: 5_000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    // stripeClientSecret is returned to frontend so customer can confirm payment.
    // Capture happens later via BullMQ after operator approves documents.
    return reservation;
  }

  /**
   * Customer cancels a PENDING_DEPOSIT reservation.
   * OPERATOR/ADMIN can cancel any cancelable reservation.
   *
   * Saga:
   *  Phase 1 (DB tx): set status CANCELLED.
   *  Phase 2 (outside tx): cancel Stripe PI (non-blocking — swallow error,
   *  Stripe auto-releases uncaptured PIs after ~7 days).
   */
  async cancel(id: string, user: User): Promise<Reservation> {
    // Bug 10 fix: Use transaction with pessimistic lock to prevent race
    // condition with expiry processor and Stripe webhooks.
    const result = await this.dataSource.transaction(async (manager) => {
      const reservation = await manager
        .getRepository(Reservation)
        .createQueryBuilder("reservation")
        .where("reservation.id = :id", { id })
        .setLock("pessimistic_write")
        .getOne();

      if (!reservation) {
        throw new NotFoundException(`Reserva ${id} no encontrada.`);
      }

      // Ownership check (users can only cancel their own reservations)
      if (user.role === UserRole.USER && reservation.userId !== user.id) {
        throw new ForbiddenException("No tienes acceso a esta reserva.");
      }

      const cancelableStatuses = [
        ReservationStatus.PENDING_DEPOSIT,
        ReservationStatus.AWAITING_CAPTURE,
      ];

      // OPERATOR/ADMIN can also cancel CONFIRMED reservations
      if (user.role === UserRole.OPERATOR || user.role === UserRole.ADMIN) {
        cancelableStatuses.push(ReservationStatus.CONFIRMED);
      }

      if (!cancelableStatuses.includes(reservation.status)) {
        throw new BadRequestException(
          `No se puede cancelar una reserva en estado '${reservation.status}'.`,
        );
      }

      const originalStatus = reservation.status;
      reservation.status = ReservationStatus.CANCELLED;
      const saved = await manager.getRepository(Reservation).save(reservation);

      return {
        saved,
        originalStatus,
        stripePaymentIntentId: saved.stripePaymentIntentId,
      };
    });

    // ── Phase 2: Cancel or Refund Stripe PI (outside transaction) ─────
    if (result.stripePaymentIntentId) {
      if (result.originalStatus === ReservationStatus.CONFIRMED) {
        // BUG-11 fix: Retry refund up to 3 times with exponential backoff
        this.retryStripeAction(
          () =>
            this.stripeService.refundPaymentIntent(
              result.stripePaymentIntentId!,
            ),
          `refundPaymentIntent(${result.stripePaymentIntentId})`,
        );
      } else {
        this.stripeService
          .cancelPaymentIntent(result.stripePaymentIntentId)
          .catch((err) => {
            this.logger.error(
              `[cancel] Stripe cancelPaymentIntent failed (non-fatal): ${err.message}`,
            );
          });
      }
    }

    return result.saved;
  }

  /**
   * Operator marks an IN_PROGRESS reservation as COMPLETED (vehicle returned).
   * OPERATOR/ADMIN only.
   *
   * BUG-08 fix: Uses transaction + pessimistic_write lock to prevent
   * race conditions (e.g. double-complete from two operator tabs).
   */
  async complete(id: string): Promise<Reservation> {
    return this.dataSource.transaction(async (manager) => {
      const reservation = await manager.getRepository(Reservation).findOne({
        where: { id },
        relations: { vehicle: true },
        lock: { mode: "pessimistic_write" },
      });

      if (!reservation) {
        throw new NotFoundException(`Reserva ${id} no encontrada.`);
      }

      if (reservation.status !== ReservationStatus.IN_PROGRESS) {
        throw new BadRequestException(
          `Solo se pueden completar reservas IN_PROGRESS. Estado actual: '${reservation.status}'.`,
        );
      }

      reservation.status = ReservationStatus.COMPLETED;
      const saved = await manager.getRepository(Reservation).save(reservation);

      // Restore vehicle status to AVAILABLE if no other active reservations
      const otherActive = await manager.getRepository(Reservation).count({
        where: [
          {
            vehicleId: reservation.vehicleId,
            status: ReservationStatus.IN_PROGRESS,
          },
          {
            vehicleId: reservation.vehicleId,
            status: ReservationStatus.CONFIRMED,
          },
        ],
      });

      if (
        otherActive === 0 &&
        reservation.vehicle?.status !== VehicleStatus.AVAILABLE
      ) {
        await manager
          .getRepository(Vehicle)
          .update(
            { id: reservation.vehicleId },
            { status: VehicleStatus.AVAILABLE },
          );
      }

      return saved;
    });
  }

  // ── Sprint 5: Queries ────────────────────────────────────────

  /**
   * BUG-11 fix: Fire-and-forget Stripe action with exponential backoff retry.
   * Logs permanently after all retries fail (requires manual dashboard review).
   */
  private async retryStripeAction(
    action: () => Promise<unknown>,
    label: string,
    maxRetries = 3,
  ): Promise<void> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await action();
        return;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (attempt === maxRetries) {
          this.logger.error(
            `[retryStripeAction] ${label} PERMANENTLY FAILED after ${maxRetries} attempts: ${msg}. Requires manual review in Stripe dashboard.`,
          );
        } else {
          this.logger.warn(
            `[retryStripeAction] ${label} attempt ${attempt}/${maxRetries} failed: ${msg}. Retrying…`,
          );
          await new Promise((r) =>
            setTimeout(r, 1000 * Math.pow(2, attempt - 1)),
          );
        }
      }
    }
  }

  /**
   * Returns the authenticated user's own reservations.
   * OPERATOR/ADMIN can see all reservations.
   */
  async findMy(
    user: User,
    opts: { page: number; limit: number } = { page: 1, limit: 20 },
  ): Promise<{
    data: Reservation[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page, limit } = opts;
    const skip = (page - 1) * limit;

    const baseOptions = {
      order: { createdAt: "DESC" as const },
      relations: { vehicle: true, documents: true },
      skip,
      take: limit,
    };

    const [data, total] =
      user.role === UserRole.OPERATOR || user.role === UserRole.ADMIN
        ? await this.reservationsRepo.findAndCount(baseOptions)
        : await this.reservationsRepo.findAndCount({
            ...baseOptions,
            where: { userId: user.id },
          });

    return { data, total, page, limit };
  }

  /**
   * Returns a single reservation by ID.
   * USER can only see their own reservations.
   * OPERATOR/ADMIN can see any reservation.
   */
  async findById(id: string, user: User): Promise<Reservation> {
    const reservation = await this.reservationsRepo.findOne({
      where: { id },
      relations: { vehicle: true, documents: true },
    });

    if (!reservation) {
      throw new NotFoundException(`Reserva ${id} no encontrada.`);
    }

    if (user.role === UserRole.USER && reservation.userId !== user.id) {
      throw new ForbiddenException("No tienes acceso a esta reserva.");
    }

    return reservation;
  }
}
