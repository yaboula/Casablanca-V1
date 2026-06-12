import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  Reservation,
  ReservationStatus,
} from "../../reservations/reservation.entity";
import { isReservationTransitionAllowed } from "../../reservations/reservation-policy";
import { Vehicle, VehicleStatus } from "../../vehicles/vehicle.entity";
import { QrService } from "../../qr/qr.service";
import { SseService } from "../../sse/sse.service";
import {
  DeliveryActionResponseDto,
  DeliveryResponseDto,
  toDeliveryActionResponseDto,
  toDeliveryResponseDto,
} from "../dto/delivery-response.dto";

/**
 * Handles all delivery-floor operations:
 * - List deliveries by date
 * - QR scan check-in
 * - Manual override check-in
 *
 * SRP: no document review, no search, no Stripe here.
 */
@Injectable()
export class OperatorDeliveryService {
  private readonly logger = new Logger(OperatorDeliveryService.name);

  constructor(
    @InjectRepository(Reservation)
    private readonly reservationsRepo: Repository<Reservation>,
    @InjectRepository(Vehicle)
    private readonly vehiclesRepo: Repository<Vehicle>,
    private readonly qrService: QrService,
    private readonly sseService: SseService,
  ) {}

  // ── List ────────────────────────────────────────────────────

  /**
   * Returns CONFIRMED reservations for a given date (default: today).
   * Joins vehicle + documents so the client can show doc-readiness badges.
   */
  async getDeliveries(dateStr?: string): Promise<DeliveryResponseDto[]> {
    const date = dateStr ? new Date(dateStr) : new Date();
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const reservations = await this.reservationsRepo
      .createQueryBuilder("r")
      .leftJoinAndSelect("r.vehicle", "v")
      .leftJoinAndSelect("r.documents", "d")
      .select([
        "r.id",
        "r.customerName",
        "r.customerPhone",
        "r.vehicleId",
        "r.pickupDate",
        "r.returnDate",
        "r.pickupLocation",
        "r.totalDays",
        "r.status",
        "r.totalPriceEurCents",
        "r.depositEurCents",
        "v.id",
        "v.brand",
        "v.model",
        "v.category",
        "v.licensePlate",
        "v.imageUrl",
        "d.id",
        "d.type",
        "d.status",
      ])
      .where("r.status = :status", { status: ReservationStatus.CONFIRMED })
      .andWhere("r.pickupDate >= :start", { start })
      .andWhere("r.pickupDate <= :end", { end })
      .orderBy("r.pickupDate", "ASC")
      .getMany();

    this.logger.log(
      `getDeliveries(${dateStr ?? "today"}) → ${reservations.length} results`,
    );

    return reservations.map(toDeliveryResponseDto);
  }

  // ── Check-in ────────────────────────────────────────────────

  /**
   * Manual check-in: CONFIRMED → IN_PROGRESS without QR hash verification.
   * Operator override — e.g. customer forgot phone.
   * Idempotent: second call returns the reservation unchanged.
   */
  async manualCheckin(
    reservationId: string,
  ): Promise<DeliveryActionResponseDto> {
    const reservation = await this.reservationsRepo.findOne({
      where: { id: reservationId },
    });

    if (!reservation) {
      throw new NotFoundException("Reserva no encontrada.");
    }

    if (reservation.status === ReservationStatus.IN_PROGRESS) {
      this.logger.warn(
        `manualCheckin: reservation ${reservationId} already IN_PROGRESS — idempotent return`,
      );
      return toDeliveryActionResponseDto(reservation);
    }

    if (
      !isReservationTransitionAllowed(
        reservation.status,
        ReservationStatus.IN_PROGRESS,
      )
    ) {
      throw new ConflictException(
        `No se puede hacer check-in de una reserva en estado ${reservation.status}.`,
      );
    }

    reservation.status = ReservationStatus.IN_PROGRESS;
    const saved = await this.reservationsRepo.save(reservation);

    await this.vehiclesRepo.update(
      { id: reservation.vehicleId },
      { status: VehicleStatus.RENTED },
    );

    this.logger.log(
      `manualCheckin: reservation ${reservationId} → IN_PROGRESS`,
    );
    this.sseService.emitDeliveryUpdate(
      reservationId,
      ReservationStatus.IN_PROGRESS,
    );
    return toDeliveryActionResponseDto(saved);
  }

  /**
   * QR scan check-in: verifies hash then CONFIRMED → IN_PROGRESS.
   * Uses timing-safe comparison to prevent enumeration attacks.
   */
  async scanQr(
    reservationId: string,
    qrCodeHash: string,
    operatorId: string,
  ): Promise<DeliveryActionResponseDto> {
    const reservation = await this.reservationsRepo.findOne({
      where: { id: reservationId },
    });

    if (!reservation) {
      throw new NotFoundException("QR inválido o reserva no encontrada.");
    }

    const valid = this.qrService.verifyHash(
      qrCodeHash,
      reservationId,
      reservation.userId,
      reservation.pickupDate,
    );

    if (!valid) {
      this.logger.warn(
        `scanQr: invalid hash for reservation ${reservationId} by operator ${operatorId}`,
      );
      throw new NotFoundException("QR inválido o reserva no encontrada.");
    }

    if (reservation.status === ReservationStatus.IN_PROGRESS) {
      throw new ConflictException("Este vehículo ya fue entregado.");
    }

    if (
      !isReservationTransitionAllowed(
        reservation.status,
        ReservationStatus.IN_PROGRESS,
      )
    ) {
      throw new ConflictException(
        `No se puede entregar una reserva en estado ${reservation.status}.`,
      );
    }

    reservation.status = ReservationStatus.IN_PROGRESS;
    const saved = await this.reservationsRepo.save(reservation);

    await this.vehiclesRepo.update(
      { id: reservation.vehicleId },
      { status: VehicleStatus.RENTED },
    );

    this.logger.log(
      `scanQr: reservation ${reservationId} → IN_PROGRESS (operator: ${operatorId})`,
    );
    this.sseService.emitDeliveryUpdate(
      reservationId,
      ReservationStatus.IN_PROGRESS,
    );
    return toDeliveryActionResponseDto(saved);
  }

  // ── Stats ───────────────────────────────────────────────

  /**
   * B3.6 — Quick counters for the operator dashboard widget.
   * Counts deliveries by status for a given date (default: today).
   * Designed to be a fast, lightweight call (no joins).
   */
  async getDeliveryStats(dateStr?: string): Promise<{
    date: string;
    total: number;
    confirmed: number;
    inProgress: number;
    completed: number;
  }> {
    const date = dateStr ? new Date(dateStr) : new Date();
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const rows = await this.reservationsRepo
      .createQueryBuilder("r")
      .select("r.status", "status")
      .addSelect("COUNT(*)", "count")
      .where("r.pickupDate >= :start", { start })
      .andWhere("r.pickupDate <= :end", { end })
      .andWhere("r.status IN (:...statuses)", {
        statuses: [
          ReservationStatus.CONFIRMED,
          ReservationStatus.IN_PROGRESS,
          ReservationStatus.COMPLETED,
        ],
      })
      .groupBy("r.status")
      .getRawMany<{ status: string; count: string }>();

    const countByStatus = Object.fromEntries(
      rows.map((r) => [r.status, parseInt(r.count, 10)]),
    );

    return {
      date: date.toISOString().split("T")[0],
      total: rows.reduce((s, r) => s + parseInt(r.count, 10), 0),
      confirmed: countByStatus[ReservationStatus.CONFIRMED] ?? 0,
      inProgress: countByStatus[ReservationStatus.IN_PROGRESS] ?? 0,
      completed: countByStatus[ReservationStatus.COMPLETED] ?? 0,
    };
  }
}
