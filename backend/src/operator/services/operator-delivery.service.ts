import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  DepositStatus,
  Reservation,
  ReservationStatus,
} from "../../reservations/reservation.entity";
import { isReservationTransitionAllowed } from "../../reservations/reservation-policy";
import { QrService } from "../../qr/qr.service";
import { SseService } from "../../sse/sse.service";
import { Vehicle, VehicleStatus } from "../../vehicles/vehicle.entity";
import { AuditAction, AuditLog } from "../audit-log.entity";
import {
  DeliveryActionResponseDto,
  DeliveryResponseDto,
  toDeliveryActionResponseDto,
  toDeliveryResponseDto,
} from "../dto/delivery-response.dto";
import { ManualCheckinDto } from "../dto/operator.dto";

@Injectable()
export class OperatorDeliveryService {
  private readonly logger = new Logger(OperatorDeliveryService.name);

  constructor(
    @InjectRepository(Reservation)
    private readonly reservationsRepo: Repository<Reservation>,
    @InjectRepository(Vehicle)
    private readonly vehiclesRepo: Repository<Vehicle>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
    private readonly qrService: QrService,
    private readonly sseService: SseService,
  ) {}

  async getDeliveries(dateStr?: string): Promise<DeliveryResponseDto[]> {
    const date = dateStr ? new Date(dateStr) : new Date();
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const reservations = await this.createDeliveryDetailQuery()
      .where("r.status = :status", { status: ReservationStatus.CONFIRMED })
      .andWhere("r.pickupDate >= :start", { start })
      .andWhere("r.pickupDate <= :end", { end })
      .orderBy("r.pickupDate", "ASC")
      .getMany();

    this.logger.log(
      `getDeliveries(${dateStr ?? "today"}) -> ${reservations.length} results`,
    );

    return reservations.map(toDeliveryResponseDto);
  }

  async getDeliveryDetail(
    reservationId: string,
  ): Promise<DeliveryResponseDto> {
    const reservation = await this.createDeliveryDetailQuery()
      .where("r.id = :reservationId", { reservationId })
      .andWhere("r.status IN (:...statuses)", {
        statuses: [
          ReservationStatus.CONFIRMED,
          ReservationStatus.IN_PROGRESS,
          ReservationStatus.COMPLETED,
        ],
      })
      .getOne();

    if (!reservation) {
      throw new NotFoundException("Entrega no encontrada.");
    }

    return toDeliveryResponseDto(reservation);
  }

  async manualCheckin(
    reservationId: string,
    operatorId: string,
    dto: ManualCheckinDto,
  ): Promise<DeliveryActionResponseDto> {
    if (!dto.identityConfirmed || !dto.documentsConfirmed) {
      throw new BadRequestException(
        "Manual check-in requiere confirmar identidad y documentos.",
      );
    }

    const reservation = await this.reservationsRepo.findOne({
      where: { id: reservationId },
    });

    if (!reservation) {
      throw new NotFoundException("Reserva no encontrada.");
    }

    if (reservation.status === ReservationStatus.IN_PROGRESS) {
      await this.writeReservationAudit({
        action: "MANUAL_CHECKIN",
        operatorId,
        reservationId,
        beforeStatus: reservation.status,
        afterStatus: reservation.status,
        reason: dto.reason,
        metadata: {
          identityConfirmed: dto.identityConfirmed,
          documentsConfirmed: dto.documentsConfirmed,
          idempotent: true,
        },
      });
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

    const beforeStatus = reservation.status;
    reservation.status = ReservationStatus.IN_PROGRESS;
    const saved = await this.reservationsRepo.save(reservation);

    await this.vehiclesRepo.update(
      { id: reservation.vehicleId },
      { status: VehicleStatus.RENTED },
    );

    this.sseService.emitDeliveryUpdate(
      reservationId,
      ReservationStatus.IN_PROGRESS,
    );
    await this.writeReservationAudit({
      action: "MANUAL_CHECKIN",
      operatorId,
      reservationId,
      beforeStatus,
      afterStatus: ReservationStatus.IN_PROGRESS,
      reason: dto.reason,
      metadata: {
        identityConfirmed: dto.identityConfirmed,
        documentsConfirmed: dto.documentsConfirmed,
      },
    });

    return toDeliveryActionResponseDto(saved);
  }

  async scanQr(
    reservationId: string,
    ticketToken: string,
    operatorId: string,
  ): Promise<DeliveryActionResponseDto> {
    const verified = this.qrService.verifyTicketToken(ticketToken);
    if (!verified.valid || !verified.payload) {
      await this.writeReservationAudit({
        action: "QR_SCAN_FAILURE",
        operatorId,
        reservationId,
        beforeStatus: null,
        afterStatus: null,
        reason: `Invalid ticket token: ${verified.reason ?? "UNKNOWN"}.`,
        metadata: { tokenProvided: Boolean(ticketToken) },
      });
      throw new NotFoundException("Ticket invalido o reserva no encontrada.");
    }

    if (verified.payload.reservationId !== reservationId) {
      await this.writeReservationAudit({
        action: "QR_SCAN_FAILURE",
        operatorId,
        reservationId,
        beforeStatus: null,
        afterStatus: null,
        reason: "Ticket reservation mismatch.",
        metadata: { tokenReservationId: verified.payload.reservationId },
      });
      throw new NotFoundException("Ticket invalido o reserva no encontrada.");
    }

    const reservation = await this.reservationsRepo.findOne({
      where: { id: reservationId },
    });

    if (!reservation) {
      await this.writeReservationAudit({
        action: "QR_SCAN_FAILURE",
        operatorId,
        reservationId,
        beforeStatus: null,
        afterStatus: null,
        reason: "Reservation not found during ticket scan.",
        metadata: { tokenProvided: true },
      });
      throw new NotFoundException("Ticket invalido o reserva no encontrada.");
    }

    const tokenMatchesReservation =
      verified.payload.userId === reservation.userId &&
      verified.payload.ticketVersion ===
        (reservation.ticketTokenVersion ?? 0) &&
      !reservation.ticketRevokedAt &&
      reservation.depositStatus === DepositStatus.CAPTURED &&
      reservation.status === ReservationStatus.CONFIRMED;

    if (!tokenMatchesReservation) {
      this.logger.warn(
        `scanQr: invalid ticket for reservation ${reservationId} by operator ${operatorId}`,
      );
      await this.writeReservationAudit({
        action: "QR_SCAN_FAILURE",
        operatorId,
        reservationId,
        beforeStatus: reservation.status,
        afterStatus: reservation.status,
        reason: "Ticket failed reservation state validation.",
        metadata: {
          tokenUserIdMatches: verified.payload.userId === reservation.userId,
          tokenVersionMatches:
            verified.payload.ticketVersion ===
            (reservation.ticketTokenVersion ?? 0),
          ticketRevoked: Boolean(reservation.ticketRevokedAt),
          depositCaptured: reservation.depositStatus === DepositStatus.CAPTURED,
          reservationStatus: reservation.status,
        },
      });
      throw new NotFoundException("Ticket invalido o reserva no encontrada.");
    }

    if (reservation.status === ReservationStatus.IN_PROGRESS) {
      throw new ConflictException("Este vehiculo ya fue entregado.");
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

    const beforeStatus = reservation.status;
    reservation.status = ReservationStatus.IN_PROGRESS;
    const saved = await this.reservationsRepo.save(reservation);

    await this.vehiclesRepo.update(
      { id: reservation.vehicleId },
      { status: VehicleStatus.RENTED },
    );

    this.sseService.emitDeliveryUpdate(
      reservationId,
      ReservationStatus.IN_PROGRESS,
    );
    await this.writeReservationAudit({
      action: "QR_SCAN_SUCCESS",
      operatorId,
      reservationId,
      beforeStatus,
      afterStatus: ReservationStatus.IN_PROGRESS,
      reason: null,
      metadata: { ticketVerified: true },
    });

    return toDeliveryActionResponseDto(saved);
  }

  async completeDelivery(
    reservationId: string,
    operatorId: string,
  ): Promise<DeliveryActionResponseDto> {
    const reservation = await this.reservationsRepo.findOne({
      where: { id: reservationId },
      relations: { vehicle: true },
    });

    if (!reservation) {
      throw new NotFoundException("Entrega no encontrada.");
    }

    if (
      !isReservationTransitionAllowed(
        reservation.status,
        ReservationStatus.COMPLETED,
      )
    ) {
      await this.writeReservationAudit({
        action: "DELIVERY_COMPLETION_FAILED",
        operatorId,
        reservationId,
        beforeStatus: reservation.status,
        afterStatus: reservation.status,
        reason: "Invalid completion transition.",
        metadata: { attemptedStatus: ReservationStatus.COMPLETED },
      });
      throw new ConflictException(
        `No se puede completar una entrega en estado ${reservation.status}.`,
      );
    }

    const beforeStatus = reservation.status;
    reservation.status = ReservationStatus.COMPLETED;
    const saved = await this.reservationsRepo.save(reservation);

    const otherActive = await this.reservationsRepo.count({
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

    if (otherActive === 0) {
      await this.vehiclesRepo.update(
        { id: reservation.vehicleId },
        { status: VehicleStatus.AVAILABLE },
      );
    }

    this.sseService.emitDeliveryUpdate(
      reservationId,
      ReservationStatus.COMPLETED,
    );
    await this.writeReservationAudit({
      action: "DELIVERY_COMPLETED",
      operatorId,
      reservationId,
      beforeStatus,
      afterStatus: ReservationStatus.COMPLETED,
      reason: null,
      metadata: { vehicleId: reservation.vehicleId },
    });

    return toDeliveryActionResponseDto(saved);
  }

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

  private createDeliveryDetailQuery() {
    return this.reservationsRepo
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
      ]);
  }

  private async writeReservationAudit(input: {
    action: AuditAction;
    operatorId: string;
    reservationId: string;
    beforeStatus: string | null;
    afterStatus: string | null;
    reason: string | null;
    metadata: Record<string, unknown> | null;
  }): Promise<void> {
    await this.auditLogRepo.save(
      this.auditLogRepo.create({
        action: input.action,
        resourceType: "RESERVATION",
        documentId: null,
        reservationId: input.reservationId,
        operatorId: input.operatorId,
        beforeStatus: input.beforeStatus,
        afterStatus: input.afterStatus,
        reason: input.reason,
        metadata: input.metadata,
      }),
    );
  }
}
