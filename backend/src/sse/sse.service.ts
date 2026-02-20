import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Subject, interval, Observable, merge } from 'rxjs';
import { map, share, takeUntil } from 'rxjs/operators';
import { DocumentStatus } from '../documents/reservation-document.entity';

export interface SseEvent {
  data: Record<string, unknown>;
}

@Injectable()
export class SseService implements OnModuleDestroy {
  private readonly logger = new Logger(SseService.name);

  /**
   * In-memory map: reservationId → Subject.
   * For MVP (single instance). Multi-instance: swap for Redis Pub/Sub.
   */
  private readonly reservationSubjects = new Map<string, Subject<SseEvent>>();

  /** Operator chat stream — single shared stream for all operators */
  private readonly operatorChatSubject = new Subject<SseEvent>();

  // ── Reservation stream ───────────────────────────────────────

  /**
   * Returns an Observable for a reservation's status stream.
   * Includes keepalive pings every 15s so proxies don't close the connection.
   */
  subscribeToReservation(reservationId: string): Observable<SseEvent> {
    if (!this.reservationSubjects.has(reservationId)) {
      this.reservationSubjects.set(reservationId, new Subject<SseEvent>());
    }

    const subject$ = this.reservationSubjects.get(reservationId)!;
    const keepalive$ = interval(15_000).pipe(
      map(() => ({ data: { type: 'ping', timestamp: Date.now() } })),
    );

    return merge(subject$.asObservable(), keepalive$).pipe(share());
  }

  /**
   * Emits a document status update event to the customer's waiting room.
   * Called by OperatorService after approve/reject.
   */
  emitDocumentStatus(
    reservationId: string,
    status: DocumentStatus | 'AWAITING_CAPTURE',
    rejectionReason?: string | null,
  ): void {
    const subject = this.reservationSubjects.get(reservationId);

    if (!subject) {
      this.logger.warn(
        `No SSE subscriber for reservation ${reservationId} — client may have disconnected.`,
      );
      return;
    }

    subject.next({
      data: {
        type: 'DOCUMENT_STATUS_UPDATE',
        documentStatus: status,
        rejectionReason: rejectionReason ?? null,
        timestamp: Date.now(),
      },
    });

    // Close the stream after a final decision (APPROVED or REJECTED from capture)
    if (status === DocumentStatus.APPROVED || status === DocumentStatus.REJECTED) {
      setTimeout(() => {
        subject.complete();
        this.reservationSubjects.delete(reservationId);
      }, 1000);
    }
  }

  /**
   * Emits a reservation status change (AWAITING_CAPTURE → UI: "Procesando pago…")
   */
  emitReservationStatus(
    reservationId: string,
    status: string,
    payload?: Record<string, unknown>,
  ): void {
    const subject = this.reservationSubjects.get(reservationId);
    if (subject) {
      subject.next({
        data: {
          type: 'RESERVATION_STATUS_UPDATE',
          status,
          ...payload,
          timestamp: Date.now(),
        },
      });
    }
  }

  // ── Operator chat stream ─────────────────────────────────────

  /** Observable for the operator panel — receives all new chat messages */
  subscribeOperatorChat(): Observable<SseEvent> {
    const keepalive$ = interval(15_000).pipe(
      map(() => ({ data: { type: 'ping', timestamp: Date.now() } })),
    );
    return merge(this.operatorChatSubject.asObservable(), keepalive$).pipe(share());
  }

  /** Called by ChatService when a new message arrives */
  emitNewChatMessage(message: Record<string, unknown>): void {
    this.operatorChatSubject.next({
      data: { type: 'NEW_MESSAGE', message },
    });
  }

  // ── Cleanup ──────────────────────────────────────────────────

  onModuleDestroy() {
    for (const [id, subject] of this.reservationSubjects) {
      subject.complete();
    }
    this.reservationSubjects.clear();
    this.operatorChatSubject.complete();
  }
}
