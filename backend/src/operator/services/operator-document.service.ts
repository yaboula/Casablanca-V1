import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import {
  DepositRefundStatus,
  DepositStatus,
  Reservation,
  ReservationStatus,
} from "../../reservations/reservation.entity";
import { isReservationTransitionAllowed } from "../../reservations/reservation-policy";
import {
  ReservationDocument,
  DocumentStatus,
  DocumentType,
} from "../../documents/reservation-document.entity";
import { QrService } from "../../qr/qr.service";
import { SseService } from "../../sse/sse.service";
import { S3Service } from "../../s3/s3.service";
import { AuditLog } from "../audit-log.entity";
import {
  DocumentReviewResultDto,
  PendingDocumentResponseDto,
  ReviewedDocumentResponseDto,
  toPendingDocumentResponseDto,
  toReviewedDocumentResponseDto,
} from "../dto/document-response.dto";

/**
 * Handles the full document review lifecycle:
 * - List pending documents (enriched with S3 presigned read URLs)
 * - Approve (triggers Stripe saga when both docs approved)
 * - Reject (emits SSE, enqueues S3 cleanup)
 *
 * SRP: no delivery/checkin logic, no search here.
 */
@Injectable()
export class OperatorDocumentService {
  private readonly logger = new Logger(OperatorDocumentService.name);

  constructor(
    @InjectRepository(ReservationDocument)
    private readonly docsRepo: Repository<ReservationDocument>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
    @InjectQueue("capture-stripe")
    private readonly captureStripeQueue: Queue,
    @InjectQueue("document-cleanup")
    private readonly documentCleanupQueue: Queue,
    private readonly dataSource: DataSource,
    private readonly qrService: QrService,
    private readonly sseService: SseService,
    private readonly s3Service: S3Service,
  ) {}

  // ── List ────────────────────────────────────────────────────

  /**
   * Returns all documents pending operator review (oldest first — FIFO fairness).
   * S3 presign calls run in parallel — no N+1 sequential await.
   */
  async getPendingDocuments(): Promise<PendingDocumentResponseDto[]> {
    const docs = await this.docsRepo
      .createQueryBuilder("d")
      .leftJoinAndSelect("d.user", "u")
      .select([
        "d.id",
        "d.type",
        "d.status",
        "d.fileKey",
        "d.reservationId",
        "d.createdAt",
        "u.id",
        "u.fullName",
      ])
      .where("d.status = :status", { status: DocumentStatus.PENDING_REVIEW })
      .orderBy("d.createdAt", "ASC")
      .getMany();

    this.logger.log(`getPendingDocuments → ${docs.length} docs`);

    // ADR: parallel presign — no sequential await loop (DEUDA-OP-02 fix)
    return Promise.all(
      docs.map(async (doc) => {
        const now = Date.now();
        const uploadedMs = now - new Date(doc.createdAt).getTime();
        const uploadedAgo = this.formatDuration(uploadedMs);

        const fileUrl = await this.s3Service.generatePresignedRead(doc.fileKey);
        const customerName = doc.user?.fullName ?? "Cliente";

        return toPendingDocumentResponseDto(
          doc,
          fileUrl,
          customerName,
          uploadedAgo,
        );
      }),
    );
  }

  // ── Approve ─────────────────────────────────────────────────

  /**
   * Approves a document.
   *
   * PHASE 1 – DB transaction (pessimistic_write):
   *   1. Lock + assert document is PENDING_REVIEW
   *   2. Mark document APPROVED + record reviewer
   *   3. Check if BOTH passport + driving_license are now APPROVED
   *   4. If yes → reservation AWAITING_CAPTURE + generate QR hash
   *
   * PHASE 2 – outside transaction (external side-effects):
   *   5. SSE: per-document status so WaitingRoom shows checkmarks
   *   6. If bothApproved → enqueue capture-stripe (5 retries, exponential)
   *   7. If bothApproved → SSE AWAITING_CAPTURE to customer
   *
   * ⚠️  Stripe is NEVER called inside a DB transaction.
   */
  async approveDocument(
    documentId: string,
    operatorId: string,
  ): Promise<DocumentReviewResultDto> {
    const { reservationId, captureQueued, doc, reservationStatus } =
      await this.dataSource.transaction(async (manager) => {
        const document = await manager
          .getRepository(ReservationDocument)
          .findOne({
            where: { id: documentId },
            lock: { mode: "pessimistic_write" },
          });

        if (!document) {
          throw new NotFoundException("Documento no encontrado.");
        }

        if (document.status !== DocumentStatus.PENDING_REVIEW) {
          throw new ConflictException(
            `El documento ya fue ${
              document.status === DocumentStatus.APPROVED
                ? "aprobado"
                : "rechazado"
            }.`,
          );
        }

        document.status = DocumentStatus.APPROVED;
        document.reviewedBy = operatorId;
        document.reviewedAt = new Date();
        await manager.getRepository(ReservationDocument).save(document);

        const allDocs = await manager
          .getRepository(ReservationDocument)
          .find({ where: { reservationId: document.reservationId } });

        const approvedTypes = new Set(
          allDocs
            .filter((d) => d.status === DocumentStatus.APPROVED)
            .map((d) => d.type),
        );

        const bothApproved =
          approvedTypes.has(DocumentType.PASSPORT) &&
          approvedTypes.has(DocumentType.DRIVING_LICENSE);

        let captureQueued = false;
        let reservationStatus = ReservationStatus.PENDING_DEPOSIT;

        if (bothApproved) {
          const reservation = await manager
            .getRepository(Reservation)
            .createQueryBuilder("reservation")
            .where("reservation.id = :id", { id: document.reservationId })
            .setLock("pessimistic_write")
            .getOne();

          if (reservation) {
            reservationStatus = reservation.status;

            if (reservation.status === ReservationStatus.PENDING_DEPOSIT) {
              if (
                !isReservationTransitionAllowed(
                  reservation.status,
                  ReservationStatus.AWAITING_CAPTURE,
                )
              ) {
                throw new ConflictException(
                  `No se puede mover la reserva ${reservation.id} desde ${reservation.status} a ${ReservationStatus.AWAITING_CAPTURE}.`,
                );
              }

              reservation.status = ReservationStatus.AWAITING_CAPTURE;
              reservation.qrCodeHash = this.qrService.generateHash(
                reservation.id,
                reservation.userId,
                reservation.pickupDate,
              );
              reservation.depositStatus = DepositStatus.CAPTURE_QUEUED;
              reservation.depositLastFailureAt = null;
              reservation.depositLastFailureReason = null;
              reservation.depositRefundStatus =
                DepositRefundStatus.NOT_APPLICABLE;
              reservation.depositRefundAttemptedAt = null;
              reservation.depositRefundFailureAt = null;
              reservation.depositRefundFailureReason = null;
              await manager.getRepository(Reservation).save(reservation);
              reservationStatus = ReservationStatus.AWAITING_CAPTURE;
              captureQueued = true;
            } else if (
              reservation.status !== ReservationStatus.AWAITING_CAPTURE &&
              reservation.status !== ReservationStatus.CONFIRMED
            ) {
              throw new ConflictException(
                `No se puede completar la revisión documental de una reserva en estado ${reservation.status}.`,
              );
            }
          }
        }

        return {
          reservationId: document.reservationId,
          captureQueued,
          doc: document,
          reservationStatus,
        };
      });

    // ── Phase 2: outside transaction ─────────────────────────
    this.sseService.emitDocumentStatus(
      reservationId,
      DocumentStatus.APPROVED,
    );
    this.sseService.emitOperatorDocumentQueueInvalidation(reservationId);
    // B3.4: Write immutable audit log entry
    await this.auditLogRepo.save(
      this.auditLogRepo.create({
        action: "APPROVE",
        resourceType: "DOCUMENT",
        documentId: doc.id,
        reservationId,
        operatorId,
        beforeStatus: DocumentStatus.PENDING_REVIEW,
        afterStatus: DocumentStatus.APPROVED,
        reason: null,
        metadata: { documentType: doc.type },
      }),
    );
    if (captureQueued) {
      await this.captureStripeQueue.add(
        "capture",
        { reservationId },
        {
          attempts: 5,
          backoff: { type: "exponential", delay: 3_000 },
          removeOnComplete: true,
          removeOnFail: false,
        },
      );

      this.sseService.emitReservationStatus(
        reservationId,
        ReservationStatus.AWAITING_CAPTURE,
      );

      this.logger.log(
        `approveDocument: both approved for reservation ${reservationId} → capture-stripe enqueued`,
      );
    } else {
      this.logger.log(
        `approveDocument: doc ${documentId} approved (waiting for second doc)`,
      );
    }

    return {
      document: toReviewedDocumentResponseDto(doc),
      reservationStatus,
    };
  }

  // ── Reject ──────────────────────────────────────────────────

  /**
   * Rejects a document with a reason.
   * Emits SSE immediately. S3 file cleaned up after 24 hours.
   */
  async rejectDocument(
    documentId: string,
    reason: string,
    operatorId: string,
  ): Promise<ReviewedDocumentResponseDto> {
    const doc = await this.dataSource.transaction(async (manager) => {
      const document = await manager
        .getRepository(ReservationDocument)
        .findOne({
          where: { id: documentId },
          lock: { mode: "pessimistic_write" },
        });

      if (!document) {
        throw new NotFoundException("Documento no encontrado.");
      }

      if (document.status !== DocumentStatus.PENDING_REVIEW) {
        throw new ConflictException("El documento ya fue procesado.");
      }

      document.status = DocumentStatus.REJECTED;
      document.rejectionReason = reason;
      document.reviewedBy = operatorId;
      document.reviewedAt = new Date();
      return manager.getRepository(ReservationDocument).save(document);
    });

    this.sseService.emitDocumentStatus(
      doc.reservationId,
      DocumentStatus.REJECTED,
    );
    this.sseService.emitOperatorDocumentQueueInvalidation(doc.reservationId);

    // B3.4: Write immutable audit log entry
    await this.auditLogRepo.save(
      this.auditLogRepo.create({
        action: "REJECT",
        resourceType: "DOCUMENT",
        documentId: doc.id,
        reservationId: doc.reservationId,
        operatorId,
        beforeStatus: DocumentStatus.PENDING_REVIEW,
        afterStatus: DocumentStatus.REJECTED,
        reason,
        metadata: { documentType: doc.type },
      }),
    );

    await this.documentCleanupQueue.add(
      "cleanup",
      { fileKey: doc.fileKey, documentId: doc.id },
      {
        delay: 24 * 60 * 60 * 1000,
        attempts: 3,
        backoff: { type: "exponential", delay: 10_000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    this.logger.log(
      `rejectDocument: doc ${documentId} rejected by operator ${operatorId}`,
    );
    return toReviewedDocumentResponseDto(doc);
  }

  // ── Private helpers ─────────────────────────────────────────

  private formatDuration(ms: number): string {
    if (ms < 60_000) return "<1 min";
    if (ms < 3_600_000) return `${Math.floor(ms / 60_000)} min`;
    if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)} h`;
    return `${Math.floor(ms / 86_400_000)} d`;
  }
}
