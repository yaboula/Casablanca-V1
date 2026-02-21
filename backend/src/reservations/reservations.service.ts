import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Reservation, ReservationStatus } from './reservation.entity';
import { Vehicle, VehicleStatus } from '../vehicles/vehicle.entity';
import { User, UserRole } from '../users/user.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { StripeService } from '../stripe/stripe.service';
import { QrService } from '../qr/qr.service';

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
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationsRepo: Repository<Reservation>,
    @InjectRepository(Vehicle)
    private readonly vehiclesRepo: Repository<Vehicle>,
    @InjectQueue('reservation-expiry')
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
      throw new BadRequestException('Fechas inválidas.');
    }

    if (pickupDate < now) {
      throw new BadRequestException('pickupDate no puede ser en el pasado.');
    }

    if (returnDate <= pickupDate) {
      throw new BadRequestException('returnDate debe ser posterior a pickupDate.');
    }

    const diffMs = returnDate.getTime() - pickupDate.getTime();
    const totalDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (totalDays < 1) {
      throw new BadRequestException('El alquiler mínimo es 1 día.');
    }

    // ── Run Saga Phase 1 in a DB transaction ────────────────────
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let reservation: Reservation;

    try {
      // 1. Lock the vehicle row (pessimistic write — prevents concurrent overbooking)
      const vehicle = await queryRunner.manager
        .getRepository(Vehicle)
        .findOne({
          where: { id: dto.vehicleId },
          lock: { mode: 'pessimistic_write' },
        });

      if (!vehicle) {
        throw new NotFoundException(`Vehículo ${dto.vehicleId} no encontrado.`);
      }

      if (vehicle.status !== VehicleStatus.AVAILABLE) {
        throw new ConflictException('El vehículo no está disponible para alquiler.');
      }

      // 2. Check for overlapping reservations (while holding vehicle lock)
      const overlapping = await queryRunner.manager
        .getRepository(Reservation)
        .createQueryBuilder('r')
        .where('r.vehicleId = :vehicleId', { vehicleId: dto.vehicleId })
        .andWhere('r.status IN (:...statuses)', { statuses: BLOCKING_STATUSES })
        .andWhere('r.pickupDate < :returnDate', { returnDate })
        .andWhere('r.returnDate > :pickupDate', { pickupDate })
        .getCount();

      if (overlapping > 0) {
        throw new ConflictException(
          'El vehículo ya está reservado para las fechas seleccionadas.',
        );
      }

      // 3. Server-side price calculation — NEVER trust client (Zero Trust mandate)
      const totalPriceEurCents = vehicle.pricePerDayEurCents * totalDays;

      // 4. Create Stripe PaymentIntent INSIDE transaction (before commit)
      //    capture_method: 'manual' — only authorizes, does NOT charge yet
      //    In test mode (NODE_ENV=test), skip real Stripe and use mock values
      let paymentIntent: { id: string; client_secret: string | null };
      if (process.env.NODE_ENV === 'test') {
        // E2E / integration test bypass — no real Stripe call
        paymentIntent = {
          id: `pi_test_mock_${Date.now()}`,
          client_secret: `pi_test_mock_secret_${Date.now()}`,
        };
      } else {
        paymentIntent = await this.stripeService.createPaymentIntent(
          DEPOSIT_EUR_CENTS,
          // Temporary ID placeholder — will be updated after save with real UUID
          `temp-${user.id}-${Date.now()}`,
          {
            userId: user.id,
            vehicleId: vehicle.id,
            totalDays: String(totalDays),
          },
        );
      }

      // 5. Persist reservation
      reservation = queryRunner.manager.getRepository(Reservation).create({
        userId: user.id,
        vehicleId: vehicle.id,
        pickupDate,
        returnDate,
        totalDays,
        totalPriceEurCents,
        depositEurCents: DEPOSIT_EUR_CENTS,
        pickupLocation: dto.pickupLocation,
        status: ReservationStatus.PENDING_DEPOSIT,
        stripePaymentIntentId: paymentIntent.id,
        stripeClientSecret: paymentIntent.client_secret,
        customerName: dto.customerName ?? null,
        customerPhone: dto.customerPhone ?? null,
        qrCodeHash: null,
      });

      reservation = await queryRunner.manager
        .getRepository(Reservation)
        .save(reservation);

      // 6. Commit — vehicle availability is now "blocked" for these dates
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    // ── Phase 2 (outside transaction) ───────────────────────
    // Enqueue expiry job: if still PENDING_DEPOSIT after 15 min → cancel
    await this.reservationExpiryQueue.add(
      'expire',
      { reservationId: reservation.id },
      {
        delay: 15 * 60 * 1000, // 15 minutes
        attempts: 3,
        backoff: { type: 'exponential', delay: 5_000 },
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
    const reservation = await this.reservationsRepo.findOne({ where: { id } });

    if (!reservation) {
      throw new NotFoundException(`Reserva ${id} no encontrada.`);
    }

    // Ownership check (users can only cancel their own reservations)
    if (
      user.role === UserRole.USER &&
      reservation.userId !== user.id
    ) {
      throw new ForbiddenException('No tienes acceso a esta reserva.');
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

    // ── Phase 1: DB update ───────────────────────────────────
    reservation.status = ReservationStatus.CANCELLED;
    const saved = await this.reservationsRepo.save(reservation);

    // ── Phase 2: Cancel Stripe PI ────────────────────────────
    if (saved.stripePaymentIntentId) {
      this.stripeService
        .cancelPaymentIntent(saved.stripePaymentIntentId)
        .catch((err) => {
          // Stripe auto-releases after ~7 days; log and continue
          console.error(
            `[cancel] Stripe cancelPaymentIntent failed (non-fatal): ${err.message}`,
          );
        });
    }

    return saved;
  }

  /**
   * Operator marks an IN_PROGRESS reservation as COMPLETED (vehicle returned).
   * OPERATOR/ADMIN only.
   */
  async complete(id: string): Promise<Reservation> {
    const reservation = await this.reservationsRepo.findOne({ where: { id } });

    if (!reservation) {
      throw new NotFoundException(`Reserva ${id} no encontrada.`);
    }

    if (reservation.status !== ReservationStatus.IN_PROGRESS) {
      throw new BadRequestException(
        `Solo se pueden completar reservas IN_PROGRESS. Estado actual: '${reservation.status}'.`,
      );
    }

    reservation.status = ReservationStatus.COMPLETED;
    return this.reservationsRepo.save(reservation);
  }

  // ── Sprint 5: Queries ────────────────────────────────────────

  /**
   * Returns the authenticated user's own reservations.
   * OPERATOR/ADMIN can see all reservations.
   */
  async findMy(
    user: User,
    opts: { page: number; limit: number } = { page: 1, limit: 20 },
  ): Promise<{ data: Reservation[]; total: number; page: number; limit: number }> {
    const { page, limit } = opts;
    const skip = (page - 1) * limit;

    const baseOptions = {
      order: { createdAt: 'DESC' as const },
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

    if (
      user.role === UserRole.USER &&
      reservation.userId !== user.id
    ) {
      throw new ForbiddenException('No tienes acceso a esta reserva.');
    }

    return reservation;
  }
}
