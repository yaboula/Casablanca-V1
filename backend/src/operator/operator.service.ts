import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Reservation, ReservationStatus } from '../reservations/reservation.entity';
import {
  ReservationDocument,
  DocumentStatus,
} from '../documents/reservation-document.entity';
import { QrService } from '../qr/qr.service';
import { SseService } from '../sse/sse.service';

@Injectable()
export class OperatorService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationsRepo: Repository<Reservation>,
    @InjectRepository(ReservationDocument)
    private readonly docsRepo: Repository<ReservationDocument>,
    @InjectQueue('capture-stripe')
    private readonly captureStripeQueue: Queue,
    @InjectQueue('reservation-expiry')
    private readonly reservationExpiryQueue: Queue,
    @InjectQueue('document-cleanup')
    private readonly documentCleanupQueue: Queue,
    private readonly dataSource: DataSource,
    private readonly qrService: QrService,
    private readonly sseService: SseService,
  ) {}

  // ── Deliveries ───────────────────────────────────────────────

  /**
   * Returns all CONFIRMED reservations for a given date (default: today).
   * Ordered by pickupDate ASC (most urgent first).
   */
  async getDeliveries(dateStr?: string): Promise<Reservation[]> {
    const date = dateStr ? new Date(dateStr) : new Date();
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const qb = this.reservationsRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.vehicle', 'v')
      .where('r.status = :status', { status: ReservationStatus.CONFIRMED })
      .andWhere('r.pickupDate >= :start', { start })
      .andWhere('r.pickupDate <= :end', { end })
      .orderBy('r.pickupDate', 'ASC');

    return qb.getMany();
  }

  // ── QR Scan ──────────────────────────────────────────────────

  /**
   * Manual check-in: marks CONFIRMED → IN_PROGRESS without QR hash verification.
   * Used by operators for manual override (e.g. customer forgot phone).
   */
  async manualCheckin(reservationId: string): Promise<Reservation> {
    const reservation = await this.reservationsRepo.findOne({
      where: { id: reservationId },
    });

    if (!reservation) {
      throw new NotFoundException('Reserva no encontrada.');
    }

    if (reservation.status === ReservationStatus.IN_PROGRESS) {
      return reservation; // idempotent
    }

    if (reservation.status !== ReservationStatus.CONFIRMED) {
      throw new ConflictException(
        `No se puede hacer check-in de una reserva en estado ${reservation.status}.`,
      );
    }

    reservation.status = ReservationStatus.IN_PROGRESS;
    return this.reservationsRepo.save(reservation);
  }

  /**
   * Verifies the QR hash and marks the reservation as IN_PROGRESS.
   * Idempotent: a second scan returns 409 (not 500).
   */
  async scanQr(
    reservationId: string,
    qrCodeHash: string,
    operatorId: string,
  ): Promise<Reservation> {
    const reservation = await this.reservationsRepo.findOne({
      where: { id: reservationId },
    });

    if (!reservation || reservation.qrCodeHash !== qrCodeHash) {
      throw new NotFoundException('QR inválido o reserva no encontrada.');
    }

    if (reservation.status === ReservationStatus.IN_PROGRESS) {
      throw new ConflictException('Este vehículo ya fue entregado.');
    }

    if (reservation.status !== ReservationStatus.CONFIRMED) {
      throw new ConflictException(
        `No se puede entregar una reserva en estado ${reservation.status}.`,
      );
    }

    reservation.status = ReservationStatus.IN_PROGRESS;
    return this.reservationsRepo.save(reservation);
  }

  // ── Search ───────────────────────────────────────────────────

  /**
   * Case-insensitive search across customerName, customerPhone, and ID.
   * Limited to 50 results.
   */
  async search(query: string): Promise<Reservation[]> {
    if (!query || query.trim().length < 2) {
      throw new BadRequestException('El término de búsqueda debe tener al menos 2 caracteres.');
    }

    const q = `%${query.trim()}%`;

    return this.reservationsRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.vehicle', 'v')
      .where('r.customerName ILIKE :q', { q })
      .orWhere('r.customerPhone ILIKE :q', { q })
      .orWhere('CAST(r.id AS TEXT) ILIKE :q', { q })
      .orderBy('r.createdAt', 'DESC')
      .take(50)
      .getMany();
  }

  // ── Document Review ──────────────────────────────────────────

  /**
   * Returns all documents pending operator review, ordered by oldest first (fairness).
   */
  async getPendingDocuments(): Promise<ReservationDocument[]> {
    return this.docsRepo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.reservation', 'r')
      .leftJoinAndSelect('d.user', 'u')
      .where('d.status = :status', { status: DocumentStatus.PENDING_REVIEW })
      .orderBy('d.createdAt', 'ASC')
      .getMany();
  }

  /**
   * Approves a document. If BOTH documents for the reservation are approved:
   *
   * PHASE 1 (DB transaction — no Stripe):
   *   1. Mark document as APPROVED
   *   2. If both approved → set reservation.status = AWAITING_CAPTURE
   *   3. Generate + persist qrCodeHash
   *   4. Commit transaction
   *
   * PHASE 2 (outside transaction — external calls):
   *   5. Enqueue BullMQ 'capture-stripe' job (5 retries)
   *   6. Emit SSE to customer: AWAITING_CAPTURE
   *
   * ⚠️ Stripe is NEVER called inside a DB transaction.
   */
  async approveDocument(
    documentId: string,
    operatorId: string,
  ): Promise<{ document: ReservationDocument; reservationStatus: ReservationStatus }> {
    const { reservationId, bothApproved, doc } = await this.dataSource.transaction(
      async (manager) => {
        const document = await manager
          .getRepository(ReservationDocument)
          .findOne({
            where: { id: documentId },
            lock: { mode: 'pessimistic_write' },
          });

        if (!document) {
          throw new NotFoundException('Documento no encontrado.');
        }

        if (document.status !== DocumentStatus.PENDING_REVIEW) {
          throw new ConflictException(
            `El documento ya fue ${document.status === DocumentStatus.APPROVED ? 'aprobado' : 'rechazado'}.`,
          );
        }

        document.status = DocumentStatus.APPROVED;
        document.reviewedBy = operatorId;
        document.reviewedAt = new Date();
        await manager.getRepository(ReservationDocument).save(document);

        // Check if BOTH document types are now approved
        const allDocs = await manager.getRepository(ReservationDocument).find({
          where: { reservationId: document.reservationId },
        });

        const bothApproved =
          allDocs.length >= 2 &&
          allDocs.every((d) => d.status === DocumentStatus.APPROVED);

        if (bothApproved) {
          const reservation = await manager
            .getRepository(Reservation)
            .findOne({
              where: {
                id: document.reservationId,
                status: ReservationStatus.PENDING_DEPOSIT,
              },
              lock: { mode: 'pessimistic_write' },
            });

          if (reservation) {
            // Saga intermediate state — NOT CONFIRMED yet
            reservation.status = ReservationStatus.AWAITING_CAPTURE;
            reservation.qrCodeHash = this.qrService.generateHash(
              reservation.id,
              reservation.userId,
              reservation.pickupDate,
            );
            await manager.getRepository(Reservation).save(reservation);
          }
        }

        return { reservationId: document.reservationId, bothApproved, doc: document };
      },
    );
    // ── PHASE 2: outside transaction ──────────────────────────────
    if (bothApproved) {
      // Stripe capture happens in BullMQ — NEVER in a DB transaction
      await this.captureStripeQueue.add(
        'capture',
        { reservationId },
        {
          attempts: 5,
          backoff: { type: 'exponential', delay: 3_000 },
          removeOnComplete: true,
          removeOnFail: false,
        },
      );

      // SSE: tell customer "payment processing…"
      this.sseService.emitReservationStatus(
        reservationId,
        ReservationStatus.AWAITING_CAPTURE,
      );
    }

    return {
      document: doc,
      reservationStatus: bothApproved
        ? ReservationStatus.AWAITING_CAPTURE
        : ReservationStatus.PENDING_DEPOSIT,
    };
  }

  /**
   * Rejects a document with a reason. Emits SSE to customer immediately.
   */
  async rejectDocument(
    documentId: string,
    reason: string,
    operatorId: string,
  ): Promise<ReservationDocument> {
    const doc = await this.docsRepo.findOne({ where: { id: documentId } });

    if (!doc) {
      throw new NotFoundException('Documento no encontrado.');
    }

    if (doc.status !== DocumentStatus.PENDING_REVIEW) {
      throw new ConflictException('El documento ya fue procesado.');
    }

    doc.status = DocumentStatus.REJECTED;
    doc.rejectionReason = reason;
    doc.reviewedBy = operatorId;
    doc.reviewedAt = new Date();
    await this.docsRepo.save(doc);

    // Emit SSE immediately — customer sees rejection reason in WaitingRoom
    this.sseService.emitDocumentStatus(
      doc.reservationId,
      DocumentStatus.REJECTED,
      reason,
    );

    // Enqueue S3 cleanup after 24 hours (gives customer time to re-upload)
    await this.documentCleanupQueue.add(
      'cleanup',
      { fileKey: doc.fileKey, documentId: doc.id },
      {
        delay: 24 * 60 * 60 * 1000, // 24 hours
        attempts: 3,
        backoff: { type: 'exponential', delay: 10_000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    return doc;
  }
}
