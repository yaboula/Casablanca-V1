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
import { QuoteReservationDto } from "./dto/quote-reservation.dto";
import {
  DepositRefundStatus,
  DepositStatus,
  Reservation,
  ReservationStatus,
} from "./reservation.entity";
import {
  GRACE_HOURS,
  HALF_DAY_UNTIL_HOURS,
  PricingQuote,
  PricingService,
} from "./pricing.service";
import { QrService } from "../qr/qr.service";
import { StripeService } from "../stripe/stripe.service";
import { User, UserRole } from "../users/user.entity";
import { Vehicle, VehicleStatus } from "../vehicles/vehicle.entity";

export type CustomerReservationResponse = Omit<
  Reservation,
  | "qrCodeHash"
  | "ticketTokenVersion"
  | "ticketRevokedAt"
  | "stripeClientSecret"
  | "stripePaymentIntentId"
>;

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
    private readonly pricingService: PricingService,
  ) {}

  async quote(dto: QuoteReservationDto): Promise<{
    available: boolean;
    pricing: PricingQuote;
    policy: {
      graceHours: number;
      halfDayUntilHours: number;
      pricingPolicyVersion: string;
    };
  }> {
    const { pickupAt, returnAt } = this.resolveReservationDates(dto);
    this.validateReservationWindow(pickupAt, returnAt);

    const vehicle = await this.dataSource
      .getRepository(Vehicle)
      .findOne({ where: { id: dto.vehicleId } });

    if (!vehicle) {
      throw new NotFoundException(`Vehículo ${dto.vehicleId} no encontrado.`);
    }

    if (!this.isVehicleBookable(vehicle)) {
      throw new ConflictException(
        "El vehículo no está disponible para alquiler.",
      );
    }

    const [pricing, overlapping] = await Promise.all([
      Promise.resolve(
        this.pricingService.calculateReservationPrice({
          pickupAt,
          returnAt,
          dailyRateEurCents: vehicle.pricePerDayEurCents,
        }),
      ),
      this.countOverlappingReservations(dto.vehicleId, pickupAt, returnAt),
    ]);

    return {
      available: overlapping === 0,
      pricing,
      policy: {
        graceHours: GRACE_HOURS,
        halfDayUntilHours: HALF_DAY_UNTIL_HOURS,
        pricingPolicyVersion: pricing.pricingPolicyVersion,
      },
    };
  }

  async create(
    dto: CreateReservationDto,
    user: User,
    rawIdempotencyKey?: string,
  ): Promise<Reservation> {
    const { pickupAt: pickupDate, returnAt: returnDate } =
      this.resolveReservationDates(dto);
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

    this.validateReservationWindow(pickupDate, returnDate);

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

      if (!this.isVehicleBookable(vehicle)) {
        throw new ConflictException(
          "El vehículo no está disponible para alquiler.",
        );
      }

      const pricing = this.pricingService.calculateReservationPrice({
        pickupAt: pickupDate,
        returnAt: returnDate,
        dailyRateEurCents: vehicle.pricePerDayEurCents,
      });

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

      const totalPriceEurCents = pricing.subtotalEurCents;

      reservation = queryRunner.manager.getRepository(Reservation).create({
        id: reservationUuid,
        userId: user.id,
        vehicleId: vehicle.id,
        pickupDate,
        returnDate,
        totalDays: Math.ceil(pricing.chargedDayUnitsX2 / 2),
        totalPriceEurCents,
        depositEurCents: pricing.depositEurCents,
        dailyRateEurCentsSnapshot: pricing.dailyRateEurCents,
        subtotalEurCents: pricing.subtotalEurCents,
        totalDueNowEurCents: pricing.totalDueNowEurCents,
        chargedDayUnitsX2: pricing.chargedDayUnitsX2,
        fullDays: pricing.fullDays,
        extraHours: pricing.extraHours,
        extraBillingType: pricing.extraBillingType,
        pricingPolicyVersion: pricing.pricingPolicyVersion,
        currency: pricing.currency,
        pickupLocation: dto.pickupLocation,
        status: ReservationStatus.PENDING_DEPOSIT,
        stripePaymentIntentId: null,
        stripeClientSecret: null,
        depositStatus: DepositStatus.PENDING,
        depositCapturedAt: null,
        depositLastFailureAt: null,
        depositLastFailureReason: null,
        depositRefundStatus: DepositRefundStatus.NOT_APPLICABLE,
        depositRefundAttemptedAt: null,
        depositRefundFailureAt: null,
        depositRefundFailureReason: null,
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
          reservation.totalDueNowEurCents,
          reservationUuid,
          {
            userId: user.id,
            vehicleId: reservation.vehicleId,
            subtotalEurCents: String(reservation.subtotalEurCents),
            depositEurCents: String(reservation.depositEurCents),
            totalDueNowEurCents: String(reservation.totalDueNowEurCents),
            chargedDayUnitsX2: String(reservation.chargedDayUnitsX2),
            pricingPolicyVersion: reservation.pricingPolicyVersion,
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
    this.assertCustomerOnly(user);

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

      if (reservation.status === ReservationStatus.CANCELLED) {
        return {
          saved: reservation,
          stripePaymentIntentId: reservation.stripePaymentIntentId,
          stripeAction: null as "cancel" | "refund" | null,
          refundAttemptedAt: null as Date | null,
        };
      }

      if (reservation.status === ReservationStatus.IN_PROGRESS) {
        throw new BadRequestException(
          "No se puede cancelar una reserva que ya fue entregada.",
        );
      }

      if (reservation.status === ReservationStatus.COMPLETED) {
        throw new BadRequestException(
          "No se puede cancelar una reserva completada.",
        );
      }

      this.assertReservationTransition(
        reservation.status,
        ReservationStatus.CANCELLED,
      );

      const originalStatus = reservation.status;
      reservation.status = ReservationStatus.CANCELLED;
      let stripeAction: "cancel" | "refund" | null = null;
      let refundAttemptedAt: Date | null = null;

      if (originalStatus === ReservationStatus.CONFIRMED) {
        stripeAction = "refund";
        refundAttemptedAt = new Date();
        reservation.depositRefundStatus = DepositRefundStatus.PENDING;
        reservation.depositRefundAttemptedAt = refundAttemptedAt;
        reservation.depositRefundFailureAt = null;
        reservation.depositRefundFailureReason = null;
      } else {
        stripeAction = "cancel";
        reservation.depositStatus = DepositStatus.CANCELLED;
        reservation.depositRefundStatus = DepositRefundStatus.NOT_APPLICABLE;
      }

      const saved = await manager.getRepository(Reservation).save(reservation);

      return {
        saved,
        stripePaymentIntentId: saved.stripePaymentIntentId,
        stripeAction,
        refundAttemptedAt,
      };
    });

    if (
      result.stripeAction === "cancel" &&
      result.stripePaymentIntentId
    ) {
      this.stripeService
        .cancelPaymentIntent(result.stripePaymentIntentId)
        .catch((err) => {
          this.logger.error(
            `[cancel] Stripe cancelPaymentIntent failed (non-fatal): ${err.message}`,
          );
        });
    }

    if (result.stripeAction === "refund") {
      if (!result.stripePaymentIntentId) {
        const failedAt = new Date();
        const reason =
          "No stripePaymentIntentId present for confirmed cancellation refund.";
        await this.reservationsRepo.update(
          { id: result.saved.id },
          {
            depositRefundStatus: DepositRefundStatus.FAILED,
            depositRefundFailureAt: failedAt,
            depositRefundFailureReason: reason,
          },
        );
        result.saved.depositRefundStatus = DepositRefundStatus.FAILED;
        result.saved.depositRefundFailureAt = failedAt;
        result.saved.depositRefundFailureReason = reason;
        return result.saved;
      }

      try {
        await this.stripeService.refundPaymentIntent(result.stripePaymentIntentId);
        await this.reservationsRepo.update(
          { id: result.saved.id },
          {
            depositRefundStatus: DepositRefundStatus.SUCCEEDED,
            depositRefundAttemptedAt:
              result.refundAttemptedAt ?? new Date(),
            depositRefundFailureAt: null,
            depositRefundFailureReason: null,
          },
        );
        result.saved.depositRefundStatus = DepositRefundStatus.SUCCEEDED;
        result.saved.depositRefundAttemptedAt =
          result.refundAttemptedAt ?? new Date();
        result.saved.depositRefundFailureAt = null;
        result.saved.depositRefundFailureReason = null;
      } catch (err) {
        const failedAt = new Date();
        const reason = err instanceof Error ? err.message : String(err);
        await this.reservationsRepo.update(
          { id: result.saved.id },
          {
            depositRefundStatus: DepositRefundStatus.FAILED,
            depositRefundAttemptedAt:
              result.refundAttemptedAt ?? failedAt,
            depositRefundFailureAt: failedAt,
            depositRefundFailureReason: reason,
          },
        );
        result.saved.depositRefundStatus = DepositRefundStatus.FAILED;
        result.saved.depositRefundAttemptedAt =
          result.refundAttemptedAt ?? failedAt;
        result.saved.depositRefundFailureAt = failedAt;
        result.saved.depositRefundFailureReason = reason;
        this.logger.error(
          `[cancel] Stripe refundPaymentIntent failed (non-fatal): ${reason}`,
        );
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
    data: CustomerReservationResponse[];
    total: number;
    page: number;
    limit: number;
  }> {
    this.assertCustomerOnly(user);

    const { page, limit } = opts;
    const skip = (page - 1) * limit;

    const baseOptions = {
      order: { createdAt: "DESC" as const },
      relations: { vehicle: true, documents: true },
      skip,
      take: limit,
    };

    const [data, total] = await this.reservationsRepo.findAndCount({
      ...baseOptions,
      where: { userId: user.id },
    });

    return {
      data: data.map((reservation) =>
        this.toCustomerReservationResponse(reservation),
      ),
      total,
      page,
      limit,
    };
  }

  async findById(
    id: string,
    user: User,
  ): Promise<CustomerReservationResponse> {
    this.assertCustomerOnly(user);

    const reservation = await this.reservationsRepo.findOne({
      where: { id },
      relations: { vehicle: true, documents: true },
    });

    if (!reservation) {
      throw new NotFoundException(`Reserva ${id} no encontrada.`);
    }

    if (reservation.userId !== user.id) {
      throw new ForbiddenException("No tienes acceso a esta reserva.");
    }

    return this.toCustomerReservationResponse(reservation);
  }

  async issueTicketToken(
    id: string,
    user: User,
  ): Promise<{ ticketToken: string; expiresAt: string }> {
    this.assertCustomerOnly(user);

    const reservation = await this.reservationsRepo.findOne({
      where: { id },
    });

    if (!reservation) {
      throw new NotFoundException(`Reserva ${id} no encontrada.`);
    }

    if (reservation.userId !== user.id) {
      throw new ForbiddenException("No tienes acceso a esta reserva.");
    }

    if (reservation.status !== ReservationStatus.CONFIRMED) {
      throw new ConflictException(
        "El ticket solo esta disponible cuando la reserva esta confirmada.",
      );
    }

    if (reservation.depositStatus !== DepositStatus.CAPTURED) {
      throw new ConflictException(
        "El ticket solo esta disponible cuando el deposito fue capturado.",
      );
    }

    if (reservation.ticketRevokedAt) {
      throw new ConflictException("El ticket de esta reserva fue revocado.");
    }

    return this.qrService.issueTicketToken({
      reservationId: reservation.id,
      userId: reservation.userId,
      ticketVersion: reservation.ticketTokenVersion ?? 0,
    });
  }

  private resolveReservationDates(
    dto: Pick<CreateReservationDto, "pickupAt" | "returnAt" | "pickupDate" | "returnDate">,
  ): { pickupAt: Date; returnAt: Date } {
    const pickupValue = dto.pickupAt ?? dto.pickupDate;
    const returnValue = dto.returnAt ?? dto.returnDate;

    if (!pickupValue || !returnValue) {
      throw new BadRequestException("pickupAt and returnAt are required.");
    }

    return {
      pickupAt: new Date(pickupValue),
      returnAt: new Date(returnValue),
    };
  }

  private validateReservationWindow(pickupAt: Date, returnAt: Date): void {
    const now = new Date();

    if (Number.isNaN(pickupAt.getTime()) || Number.isNaN(returnAt.getTime())) {
      throw new BadRequestException("Invalid pickup or return datetime.");
    }

    if (pickupAt < now && process.env.BYPASS_STRIPE !== "true") {
      throw new BadRequestException("pickupAt cannot be in the past.");
    }

    if (returnAt <= pickupAt) {
      throw new BadRequestException("returnAt must be after pickupAt.");
    }
  }

  private isVehicleBookable(vehicle: Vehicle): boolean {
    return vehicle.status === VehicleStatus.AVAILABLE;
  }

  private async countOverlappingReservations(
    vehicleId: string,
    pickupAt: Date,
    returnAt: Date,
  ): Promise<number> {
    return this.reservationsRepo
      .createQueryBuilder("r")
      .where("r.vehicleId = :vehicleId", { vehicleId })
      .andWhere("r.status IN (:...statuses)", {
        statuses: BLOCKING_RESERVATION_STATUSES,
      })
      .andWhere("r.pickupDate < :returnAt", { returnAt })
      .andWhere("r.returnDate > :pickupAt", { pickupAt })
      .getCount();
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
    const { pickupAt, returnAt } = this.resolveReservationDates(dto);
    const samePayload =
      reservation.vehicleId === dto.vehicleId &&
      reservation.pickupDate.toISOString() === pickupAt.toISOString() &&
      reservation.returnDate.toISOString() === returnAt.toISOString() &&
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

  private assertCustomerOnly(user: User): void {
    if (user.role !== UserRole.USER) {
      throw new ForbiddenException(
        "Este endpoint es solo para clientes. Usa los endpoints de staff/operator.",
      );
    }
  }

  private toCustomerReservationResponse(
    reservation: Reservation,
  ): CustomerReservationResponse {
    const {
      qrCodeHash: _qrCodeHash,
      ticketTokenVersion: _ticketTokenVersion,
      ticketRevokedAt: _ticketRevokedAt,
      stripeClientSecret: _stripeClientSecret,
      stripePaymentIntentId: _stripePaymentIntentId,
      ...safeReservation
    } = reservation;

    return safeReservation as CustomerReservationResponse;
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
