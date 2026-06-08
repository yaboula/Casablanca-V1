import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { InjectRepository } from "@nestjs/typeorm";
import { Queue } from "bullmq";
import { v4 as uuidv4 } from "uuid";
import { DataSource, Repository } from "typeorm";
import {
  BLOCKING_RESERVATION_STATUSES,
  getAllowedReservationTransitions,
  isReservationTransitionAllowed,
} from "./reservation-policy";
import { CreateReservationDto } from "./dto/create-reservation.dto";
import { Reservation, ReservationStatus } from "./reservation.entity";
import { QrService } from "../qr/qr.service";
import { StripeService } from "../stripe/stripe.service";
import { User, UserRole } from "../users/user.entity";
import { Vehicle, VehicleStatus } from "../vehicles/vehicle.entity";

const DEPOSIT_EUR_CENTS = 1000;

@Injectable()
export class ReservationsService {
  private readonly logger = new Logger(ReservationsService.name);

  constructor(
    @InjectRepository(Reservation)
    private readonly reservationsRepo: Repository<Reservation>,
    @InjectQueue("reservation-expiry")
    private readonly reservationExpiryQueue: Queue,
    private readonly dataSource: DataSource,
    private readonly stripeService: StripeService,
    private readonly qrService: QrService,
  ) {}

  async create(
    dto: CreateReservationDto,
    user: User,
    rawIdempotencyKey?: string,
  ): Promise<Reservation> {
    const pickupDate = new Date(dto.pickupDate);
    const returnDate = new Date(dto.returnDate);
    const now = new Date();
    const idempotencyKey = this.normalizeIdempotencyKey(rawIdempotencyKey);

    if (idempotencyKey) {
      const existingReservation = await this.findReservationByIdempotencyKey(
        user.id,
        idempotencyKey,
      );
      if (existingReservation) {
        this.assertSameIdempotentReservation(existingReservation, dto);
        return existingReservation;
      }
    }

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
    const totalDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (totalDays < 1) {
      throw new BadRequestException("El alquiler mínimo es 1 día.");
    }

    const reservationUuid = uuidv4();

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let reservation: Reservation;

    try {
      const vehicle = await queryRunner.manager.getRepository(Vehicle).findOne({
        where: { id: dto.vehicleId },
        lock: { mode: "pessimistic_write" },
      });

      if (!vehicle) {
        throw new NotFoundException(`Vehículo ${dto.vehicleId} no encontrado.`);
      }

      if (
        vehicle.status === VehicleStatus.MAINTENANCE ||
        vehicle.status === VehicleStatus.INACTIVE
      ) {
        throw new ConflictException(
          "El vehículo no está disponible para alquiler.",
        );
      }

      const overlapping = await queryRunner.manager
        .getRepository(Reservation)
        .createQueryBuilder("r")
        .where("r.vehicleId = :vehicleId", { vehicleId: dto.vehicleId })
        .andWhere("r.status IN (:...statuses)", {
          statuses: BLOCKING_RESERVATION_STATUSES,
        })
        .andWhere("r.pickupDate < :returnDate", { returnDate })
        .andWhere("r.returnDate > :pickupDate", { pickupDate })
        .getCount();

      if (overlapping > 0) {
        throw new ConflictException(
          "El vehículo ya está reservado para las fechas seleccionadas.",
        );
      }

      const totalPriceEurCents = vehicle.pricePerDayEurCents * totalDays;

      reservation = queryRunner.manager.getRepository(Reservation).create({
        id: reservationUuid,
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
        idempotencyKey,
      });

      reservation = await queryRunner.manager
        .getRepository(Reservation)
        .save(reservation);

      await queryRunner.commitTransaction();
    } catch (err: unknown) {
      await queryRunner.rollbackTransaction();

      if (this.isIdempotencyConflict(err) && idempotencyKey) {
        const existingReservation = await this.findReservationByIdempotencyKey(
          user.id,
          idempotencyKey,
        );
        if (existingReservation) {
          this.assertSameIdempotentReservation(existingReservation, dto);
          return existingReservation;
        }
      }

      throw err;
    } finally {
      await queryRunner.release();
    }

    const bypassStripe = process.env.BYPASS_STRIPE === "true";
    const paymentIntent = bypassStripe
      ? {
          id: `pi_dev_mock_${Date.now()}`,
          client_secret: `pi_dev_mock_secret_${Date.now()}`,
        }
      : await this.stripeService.createPaymentIntent(
          DEPOSIT_EUR_CENTS,
          reservationUuid,
          {
            userId: user.id,
            vehicleId: reservation.vehicleId,
            totalDays: String(totalDays),
          },
        );

    await this.reservationsRepo.update(
      { id: reservation.id },
      {
        stripePaymentIntentId: paymentIntent.id,
        stripeClientSecret: paymentIntent.client_secret,
      },
    );

    reservation.stripePaymentIntentId = paymentIntent.id;
    reservation.stripeClientSecret = paymentIntent.client_secret;

    await this.reservationExpiryQueue.add(
      "expire",
      { reservationId: reservation.id },
      {
        delay: 15 * 60 * 1000,
        attempts: 3,
        backoff: { type: "exponential", delay: 5_000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    return reservation;
  }

  async cancel(id: string, user: User): Promise<Reservation> {
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

      if (user.role === UserRole.USER && reservation.userId !== user.id) {
        throw new ForbiddenException("No tienes acceso a esta reserva.");
      }

      if (
        reservation.status === ReservationStatus.CONFIRMED &&
        user.role !== UserRole.OPERATOR &&
        user.role !== UserRole.ADMIN
      ) {
        throw new BadRequestException(
          `No se puede cancelar una reserva en estado '${reservation.status}'.`,
        );
      }

      this.assertReservationTransition(
        reservation.status,
        ReservationStatus.CANCELLED,
      );

      const originalStatus = reservation.status;
      reservation.status = ReservationStatus.CANCELLED;
      const saved = await manager.getRepository(Reservation).save(reservation);

      return {
        saved,
        originalStatus,
        stripePaymentIntentId: saved.stripePaymentIntentId,
      };
    });

    if (result.stripePaymentIntentId) {
      if (result.originalStatus === ReservationStatus.CONFIRMED) {
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

      this.assertReservationTransition(
        reservation.status,
        ReservationStatus.COMPLETED,
      );

      reservation.status = ReservationStatus.COMPLETED;
      const saved = await manager.getRepository(Reservation).save(reservation);

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
            `[retryStripeAction] ${label} attempt ${attempt}/${maxRetries} failed: ${msg}. Retrying...`,
          );
          await new Promise((r) =>
            setTimeout(r, 1000 * Math.pow(2, attempt - 1)),
          );
        }
      }
    }
  }

  private normalizeIdempotencyKey(value?: string): string | null {
    if (value === undefined) {
      return null;
    }

    const normalized = value.trim();
    if (!normalized) {
      return null;
    }

    if (normalized.length > 100) {
      throw new BadRequestException(
        "Idempotency-Key no puede exceder 100 caracteres.",
      );
    }

    return normalized;
  }

  private async findReservationByIdempotencyKey(
    userId: string,
    idempotencyKey: string,
  ): Promise<Reservation | null> {
    return this.reservationsRepo
      .createQueryBuilder("reservation")
      .addSelect("reservation.idempotencyKey")
      .leftJoinAndSelect("reservation.vehicle", "vehicle")
      .leftJoinAndSelect("reservation.documents", "documents")
      .where("reservation.userId = :userId", { userId })
      .andWhere("reservation.idempotencyKey = :idempotencyKey", {
        idempotencyKey,
      })
      .getOne();
  }

  private assertSameIdempotentReservation(
    reservation: Reservation,
    dto: CreateReservationDto,
  ): void {
    const samePayload =
      reservation.vehicleId === dto.vehicleId &&
      reservation.pickupDate.toISOString() ===
        new Date(dto.pickupDate).toISOString() &&
      reservation.returnDate.toISOString() ===
        new Date(dto.returnDate).toISOString() &&
      reservation.pickupLocation === dto.pickupLocation &&
      (reservation.customerName ?? null) === (dto.customerName ?? null) &&
      (reservation.customerPhone ?? null) === (dto.customerPhone ?? null);

    if (!samePayload) {
      throw new ConflictException(
        "Idempotency-Key ya fue usada con un payload distinto.",
      );
    }
  }

  private assertReservationTransition(
    current: ReservationStatus,
    next: ReservationStatus,
  ): void {
    if (!isReservationTransitionAllowed(current, next)) {
      throw new BadRequestException(
        `Transición inválida de reserva: '${current}' -> '${next}'. Permitidas: ${
          getAllowedReservationTransitions(current).join(", ") || "ninguna"
        }.`,
      );
    }
  }

  private isIdempotencyConflict(err: unknown): boolean {
    return (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code?: string }).code === "23505"
    );
  }
}
