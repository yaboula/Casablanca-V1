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
  DeskCollectionStatus,
  Reservation,
  ReservationStatus,
} from "../../reservations/reservation.entity";
import { isReservationTransitionAllowed } from "../../reservations/reservation-policy";
import { QrService } from "../../qr/qr.service";
import { SseService } from "../../sse/sse.service";
import { S3Service } from "../../s3/s3.service";
import { DocumentStatus } from "../../documents/reservation-document.entity";
import { Vehicle, VehicleStatus } from "../../vehicles/vehicle.entity";
import { AuditAction, AuditLog } from "../audit-log.entity";
import {
  DeliveryActionResponseDto,
  DeliveryResponseDto,
  TicketCaseResolutionDto,
  toDeliveryActionResponseDto,
  toDeliveryResponseDto,
  toTicketCaseResolutionDto,
} from "../dto/delivery-response.dto";
import {
  ConfirmHandoffDto,
  ManualCheckinDto,
  RecordDeskCollectionDto,
} from "../dto/operator.dto";

const OPERATOR_TIME_ZONE = "Africa/Casablanca";
const DASHBOARD_RESERVATION_STATUSES = [
  ReservationStatus.PENDING_DEPOSIT,
  ReservationStatus.AWAITING_CAPTURE,
  ReservationStatus.CONFIRMED,
  ReservationStatus.IN_PROGRESS,
  ReservationStatus.COMPLETED,
  ReservationStatus.CANCELLED,
] as const;
const DOCUMENT_VERIFICATION_STATUSES = [
  DocumentStatus.PENDING_REVIEW,
  DocumentStatus.REJECTED,
] as const;

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
    private readonly s3Service: S3Service,
  ) {}

  async getDeliveries(dateStr?: string): Promise<DeliveryResponseDto[]> {
    const businessDate = this.resolveBusinessDate(dateStr);

    const reservations = await this.createDeliveryDetailQuery()
      .where("r.status IN (:...statuses)", {
        statuses: DASHBOARD_RESERVATION_STATUSES,
      })
      .orderBy(
        `CASE
          WHEN EXISTS (
            SELECT 1
            FROM reservation_documents rd
            WHERE rd.reservation_id = r.id
            AND rd.status IN (:...documentVerificationStatuses)
          ) THEN 0
          WHEN r.status = '${ReservationStatus.IN_PROGRESS}' THEN 1
          WHEN DATE(r.pickupDate AT TIME ZONE '${OPERATOR_TIME_ZONE}') = :businessDate THEN 2
          WHEN DATE(r.pickupDate AT TIME ZONE '${OPERATOR_TIME_ZONE}') > :businessDate THEN 3
          WHEN r.status IN ('${ReservationStatus.COMPLETED}', '${ReservationStatus.CANCELLED}') THEN 5
          ELSE 4
        END`,
        "ASC",
      )
      .setParameters({
        businessDate,
        documentVerificationStatuses: DOCUMENT_VERIFICATION_STATUSES,
      })
      .addOrderBy("r.pickupDate", "ASC")
      .getMany();

    this.logger.log(
      `getDeliveries(${businessDate}) -> ${reservations.length} results`,
    );

    return reservations.map((reservation) => toDeliveryResponseDto(reservation));
  }

  async getDeliveryDetail(
    reservationId: string,
  ): Promise<DeliveryResponseDto> {
    const reservation = await this.createDeliveryDetailQuery()
      .where("r.id = :reservationId", { reservationId })
      .andWhere("r.status IN (:...statuses)", {
        statuses: [
          ReservationStatus.PENDING_DEPOSIT,
          ReservationStatus.AWAITING_CAPTURE,
          ReservationStatus.CONFIRMED,
          ReservationStatus.IN_PROGRESS,
          ReservationStatus.COMPLETED,
          ReservationStatus.CANCELLED,
        ],
      })
      .getOne();

    if (!reservation) {
      throw new NotFoundException("Entrega no encontrada.");
    }

    const documentFileUrls = await this.resolveDocumentFileUrls(
      reservation.documents ?? [],
    );

    return toDeliveryResponseDto(reservation, { documentFileUrls });
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
      relations: { documents: true },
    });

    if (!reservation) {
      throw new NotFoundException("Reserva no encontrada.");
    }

    const expectedManualCode = this.getReservationManualCode(reservation.id);
    const providedManualCode = this.normalizeManualCode(dto.manualCode);

    if (providedManualCode !== expectedManualCode) {
      throw new BadRequestException(
        "El codigo manual no coincide con esta reserva.",
      );
    }

    const docsApproved =
      (reservation.documents ?? []).filter(
        (document) => document.status === DocumentStatus.APPROVED,
      ).length >= 2;

    if (!docsApproved) {
      throw new ConflictException(
        "Manual check-in no puede saltar documentos pendientes.",
      );
    }

    if (reservation.depositStatus !== DepositStatus.CAPTURED) {
      throw new ConflictException(
        "Manual check-in no puede saltar deposito no capturado.",
      );
    }

    if (
      this.isDeskCollectionRequired(reservation) &&
      reservation.deskCollectionStatus !== DeskCollectionStatus.RECEIVED
    ) {
      throw new ConflictException(
        "Manual check-in no puede saltar cobro pendiente en mostrador.",
      );
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
          manualCodeMatched: true,
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
        manualCodeMatched: true,
      },
    });

    return toDeliveryActionResponseDto(saved);
  }

  async resolveTicketCase(
    ticketToken: string,
    operatorId: string,
    expectedReservationId?: string,
  ): Promise<TicketCaseResolutionDto> {
    const verified = this.qrService.verifyTicketToken(ticketToken);
    const auditReservationId =
      verified.payload?.reservationId ?? expectedReservationId ?? null;

    if (!verified.valid || !verified.payload) {
      await this.writeReservationAudit({
        action: "QR_SCAN_FAILURE",
        operatorId,
        reservationId: auditReservationId,
        beforeStatus: null,
        afterStatus: null,
        reason: `Invalid ticket token: ${verified.reason ?? "UNKNOWN"}.`,
        metadata: { tokenProvided: Boolean(ticketToken), purpose: "CASE_LOOKUP" },
      });
      throw new NotFoundException("Ticket invalido o reserva no encontrada.");
    }

    if (
      expectedReservationId &&
      verified.payload.reservationId !== expectedReservationId
    ) {
      await this.writeReservationAudit({
        action: "QR_SCAN_FAILURE",
        operatorId,
        reservationId: expectedReservationId,
        beforeStatus: null,
        afterStatus: null,
        reason: "Ticket reservation mismatch.",
        metadata: {
          tokenReservationId: verified.payload.reservationId,
          purpose: "CASE_LOOKUP",
        },
      });
      throw new NotFoundException("Ticket invalido o reserva no encontrada.");
    }

    const reservation = await this.reservationsRepo.findOne({
      where: { id: verified.payload.reservationId },
    });

    if (!reservation) {
      await this.writeReservationAudit({
        action: "QR_SCAN_FAILURE",
        operatorId,
        reservationId: verified.payload.reservationId,
        beforeStatus: null,
        afterStatus: null,
        reason: "Reservation not found during ticket case lookup.",
        metadata: { tokenProvided: true, purpose: "CASE_LOOKUP" },
      });
      throw new NotFoundException("Ticket invalido o reserva no encontrada.");
    }

    const tokenMatchesReservation =
      verified.payload.userId === reservation.userId &&
      verified.payload.ticketVersion ===
        (reservation.ticketTokenVersion ?? 0) &&
      !reservation.ticketRevokedAt &&
      reservation.depositStatus === DepositStatus.CAPTURED &&
      [
        ReservationStatus.CONFIRMED,
        ReservationStatus.IN_PROGRESS,
        ReservationStatus.COMPLETED,
      ].includes(reservation.status);

    if (!tokenMatchesReservation) {
      this.logger.warn(
        `resolveTicketCase: invalid ticket for reservation ${reservation.id} by operator ${operatorId}`,
      );
      await this.writeReservationAudit({
        action: "QR_SCAN_FAILURE",
        operatorId,
        reservationId: reservation.id,
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
          purpose: "CASE_LOOKUP",
        },
      });
      throw new NotFoundException("Ticket invalido o reserva no encontrada.");
    }

    await this.writeReservationAudit({
      action: "QR_SCAN_SUCCESS",
      operatorId,
      reservationId: reservation.id,
      beforeStatus: reservation.status,
      afterStatus: reservation.status,
      reason: null,
      metadata: { ticketVerified: true, purpose: "CASE_LOOKUP" },
    });

    return toTicketCaseResolutionDto(reservation);
  }

  async scanQr(
    reservationId: string,
    ticketToken: string,
    operatorId: string,
  ): Promise<TicketCaseResolutionDto> {
    return this.resolveTicketCase(ticketToken, operatorId, reservationId);
  }

  async confirmHandoff(
    reservationId: string,
    operatorId: string,
    dto: ConfirmHandoffDto,
  ): Promise<DeliveryActionResponseDto> {
    if (!dto.identityConfirmed || !dto.documentsConfirmed) {
      throw new BadRequestException(
        "La entrega requiere confirmar identidad y documentos.",
      );
    }

    const reservation = await this.reservationsRepo.findOne({
      where: { id: reservationId },
      relations: { documents: true },
    });

    if (!reservation) {
      throw new NotFoundException("Reserva no encontrada.");
    }

    const docsApproved =
      (reservation.documents ?? []).filter(
        (document) => document.status === DocumentStatus.APPROVED,
      ).length >= 2;

    if (!docsApproved) {
      throw new ConflictException(
        "No se puede entregar una reserva sin documentos aprobados.",
      );
    }

    if (reservation.depositStatus !== DepositStatus.CAPTURED) {
      throw new ConflictException(
        "No se puede entregar una reserva sin deposito capturado.",
      );
    }

    if (
      this.isDeskCollectionRequired(reservation) &&
      reservation.deskCollectionStatus !== DeskCollectionStatus.RECEIVED
    ) {
      throw new ConflictException(
        "No se puede entregar una reserva sin registrar el cobro pendiente.",
      );
    }

    if (reservation.status === ReservationStatus.IN_PROGRESS) {
      return toDeliveryActionResponseDto(reservation);
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
      action: "HANDOFF_CONFIRMED",
      operatorId,
      reservationId,
      beforeStatus,
      afterStatus: ReservationStatus.IN_PROGRESS,
      reason: null,
      metadata: {
        identityConfirmed: dto.identityConfirmed,
        documentsConfirmed: dto.documentsConfirmed,
      },
    });

    return toDeliveryActionResponseDto(saved);
  }

  async recordDeskCollection(
    reservationId: string,
    operatorId: string,
    dto: RecordDeskCollectionDto,
  ): Promise<DeliveryActionResponseDto> {
    const reservation = await this.reservationsRepo.findOne({
      where: { id: reservationId },
    });

    if (!reservation) {
      throw new NotFoundException("Reserva no encontrada.");
    }

    if (
      ![
        ReservationStatus.PENDING_DEPOSIT,
        ReservationStatus.AWAITING_CAPTURE,
        ReservationStatus.CONFIRMED,
        ReservationStatus.IN_PROGRESS,
      ].includes(reservation.status)
    ) {
      throw new ConflictException(
        `No se puede registrar cobro en una reserva en estado ${reservation.status}.`,
      );
    }

    const expectedBalanceCents = this.getBalanceDueCents(reservation);
    if (expectedBalanceCents <= 0) {
      throw new ConflictException(
        "Esta reserva no requiere cobro en mostrador.",
      );
    }

    const beforeStatus = reservation.status;
    const recordedAt = new Date();
    reservation.deskCollectionStatus = DeskCollectionStatus.RECEIVED;
    reservation.deskCollectionMethod = dto.method;
    reservation.deskCollectionReference = dto.receiptReference.trim();
    reservation.deskCollectionAmountEurCents = expectedBalanceCents;
    reservation.deskCollectionReceivedAt = recordedAt;

    const saved = await this.reservationsRepo.save(reservation);

    this.sseService.emitDeliveryUpdate(reservationId, reservation.status);
    await this.writeReservationAudit({
      action: "DESK_COLLECTION_RECORDED",
      operatorId,
      reservationId,
      beforeStatus,
      afterStatus: reservation.status,
      reason: null,
      metadata: {
        amountEurCents: expectedBalanceCents,
        method: dto.method,
        receiptReference: dto.receiptReference.trim(),
        recordedAt: recordedAt.toISOString(),
      },
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
    pendingDeposit: number;
    awaitingCapture: number;
    confirmed: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  }> {
    const businessDate = this.resolveBusinessDate(dateStr);

    const rows = await this.reservationsRepo
      .createQueryBuilder("r")
      .select("r.status", "status")
      .addSelect("COUNT(*)", "count")
      .where("r.status IN (:...statuses)", {
        statuses: DASHBOARD_RESERVATION_STATUSES,
      })
      .groupBy("r.status")
      .getRawMany<{ status: string; count: string }>();

    const countByStatus = Object.fromEntries(
      rows.map((r) => [r.status, parseInt(r.count, 10)]),
    );

    return {
      date: businessDate,
      total: rows.reduce((s, r) => s + parseInt(r.count, 10), 0),
      pendingDeposit: countByStatus[ReservationStatus.PENDING_DEPOSIT] ?? 0,
      awaitingCapture: countByStatus[ReservationStatus.AWAITING_CAPTURE] ?? 0,
      confirmed: countByStatus[ReservationStatus.CONFIRMED] ?? 0,
      inProgress: countByStatus[ReservationStatus.IN_PROGRESS] ?? 0,
      completed: countByStatus[ReservationStatus.COMPLETED] ?? 0,
      cancelled: countByStatus[ReservationStatus.CANCELLED] ?? 0,
    };
  }

  private resolveBusinessDate(dateStr?: string): string {
    if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }

    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: OPERATOR_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    return formatter.format(new Date());
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
        "r.depositStatus",
        "r.currency",
        "r.deskCollectionStatus",
        "r.deskCollectionMethod",
        "r.deskCollectionReference",
        "r.deskCollectionReceivedAt",
        "r.deskCollectionAmountEurCents",
        "v.id",
        "v.brand",
        "v.model",
        "v.category",
        "v.licensePlate",
        "v.imageUrl",
        "d.id",
        "d.type",
        "d.status",
        "d.fileKey",
        "d.rejectionReason",
        "d.createdAt",
      ]);
  }

  private async resolveDocumentFileUrls(
    documents: NonNullable<Reservation["documents"]>,
  ): Promise<Map<string, string>> {
    const entries = await Promise.all(
      documents.map(async (doc) => {
        const fileUrl = this.s3Service.isBypassStorageEnabled()
          ? `/api/v1/documents/file/${doc.id}`
          : await this.s3Service.generatePresignedRead(doc.fileKey);

        return [doc.id, fileUrl] as const;
      }),
    );

    return new Map(entries);
  }

  private getReservationManualCode(reservationId: string): string {
    return reservationId.replace(/-/g, "").toUpperCase().slice(0, 8);
  }

  private normalizeManualCode(manualCode: string): string {
    return manualCode.replace(/[\s-]/g, "").toUpperCase();
  }

  private getBalanceDueCents(reservation: Reservation): number {
    return (reservation.totalPriceEurCents ?? 0) - (reservation.depositEurCents ?? 0);
  }

  private isDeskCollectionRequired(reservation: Reservation): boolean {
    return this.getBalanceDueCents(reservation) > 0;
  }

  private async writeReservationAudit(input: {
    action: AuditAction;
    operatorId: string;
    reservationId: string | null;
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
