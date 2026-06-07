import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { Subject, interval, Observable, merge } from "rxjs";
import { map, share, takeUntil } from "rxjs/operators";
import {
  DocumentStatus,
  DocumentType,
} from "../documents/reservation-document.entity";

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

  /** Operator deliveries stream — emitted on check-in / scan-qr state changes */
  private readonly operatorDeliveriesSubject = new Subject<SseEvent>();

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
      map(() => ({ data: { type: "ping", timestamp: Date.now() } })),
    );

    return merge(subject$.asObservable(), keepalive$).pipe(share());
  }

  /**
   * Emits a document status update event to the customer's waiting room.
   * Called by OperatorService after approve/reject.
   */
  emitDocumentStatus(
    reservationId: string,
    status: DocumentStatus | "AWAITING_CAPTURE",
    rejectionReason?: string | null,
    documentType?: DocumentType,
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
        type: "DOCUMENT_STATUS_UPDATE",
        documentStatus: status,
        documentType: documentType ?? null,
        rejectionReason: rejectionReason ?? null,
        timestamp: Date.now(),
      },
    });

    // Bug 4 fix: Do NOT close on individual doc APPROVED/REJECTED.
    // Stream must stay open to deliver the SECOND document's status.
    // Stream is closed only on terminal reservation states (see emitReservationStatus).
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
          type: "RESERVATION_STATUS_UPDATE",
          status,
          ...payload,
          timestamp: Date.now(),
        },
      });

      // Bug 4 fix: Close stream on terminal reservation states
      const terminalStatuses = ["CONFIRMED", "COMPLETED", "CANCELLED"];
      if (terminalStatuses.includes(status)) {
        setTimeout(() => {
          subject.complete();
          this.reservationSubjects.delete(reservationId);
        }, 2000); // Allow event to flush before closing
      }
    }
  }

  // ── Operator chat stream ─────────────────────────────────────

  /** Observable for the operator panel — receives all new chat messages */
  subscribeOperatorChat(): Observable<SseEvent> {
    const keepalive$ = interval(15_000).pipe(
      map(() => ({ data: { type: "ping", timestamp: Date.now() } })),
    );
    return merge(this.operatorChatSubject.asObservable(), keepalive$).pipe(
      share(),
    );
  }

  /** Called by ChatService when a new message arrives */
  emitNewChatMessage(message: Record<string, unknown>): void {
    this.operatorChatSubject.next({
      data: { type: "NEW_MESSAGE", message },
    });
  }

  // ── Operator delivery stream ─────────────────────────────────────

  /**
   * Observable for the operator dashboard delivery list.
   * Emits when any reservation transitions state (check-in, QR scan).
   * Operators subscribe to trigger a router.refresh() on their client.
   */
  subscribeOperatorDeliveries(): Observable<SseEvent> {
    const keepalive$ = interval(15_000).pipe(
      map(() => ({ data: { type: "ping", timestamp: Date.now() } })),
    );
    return merge(
      this.operatorDeliveriesSubject.asObservable(),
      keepalive$,
    ).pipe(share());
  }

  /**
   * Called by OperatorDeliveryService after manualCheckin() or scanQr().
   * Broadcasts to all connected operators so their dashboards update.
   */
  emitDeliveryUpdate(reservationId: string, newStatus: string): void {
    this.operatorDeliveriesSubject.next({
      data: {
        type: "DELIVERY_UPDATE",
        reservationId,
        newStatus,
        timestamp: Date.now(),
      },
    });
  }

  // ── Cleanup ──────────────────────────────────────────────────

  onModuleDestroy() {
    for (const [id, subject] of this.reservationSubjects) {
      subject.complete();
    }
    this.reservationSubjects.clear();
    this.operatorChatSubject.complete();
    this.operatorDeliveriesSubject.complete();
  }
}
