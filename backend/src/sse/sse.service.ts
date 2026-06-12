import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { Subject, interval, Observable, merge } from "rxjs";
import { map, share, takeUntil } from "rxjs/operators";
import {
  DocumentStatus,
} from "../documents/reservation-document.entity";
import { ReservationStatus } from "../reservations/reservation.entity";
import {
  CustomerReservationSseEventDto,
  KeepaliveSseEventDto,
  NormalizedSseEventDto,
  OperatorInvalidationSseEventDto,
} from "./sse-event.dto";

export interface SseEvent {
  data: NormalizedSseEventDto;
}

export interface LegacySseEvent {
  data: Record<string, unknown>;
}

@Injectable()
export class SseService implements OnModuleDestroy {
  private readonly logger = new Logger(SseService.name);
  private readonly destroy$ = new Subject<void>();

  /**
   * In-memory map: reservationId → Subject.
   * For MVP (single instance). Multi-instance: swap for Redis Pub/Sub.
   */
  private readonly reservationSubjects = new Map<string, Subject<SseEvent>>();

  /** Operator chat stream — single shared stream for all operators */
  private readonly operatorChatSubject = new Subject<LegacySseEvent>();

  /** Operator deliveries stream — emitted on check-in / scan-qr state changes */
  private readonly operatorDeliveriesSubject = new Subject<SseEvent>();

  /** Operator document queue stream — emitted on review queue mutations */
  private readonly operatorDocumentsSubject = new Subject<SseEvent>();

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
      map(() => ({ data: this.buildKeepaliveEvent() })),
    );

    return merge(subject$.asObservable(), keepalive$).pipe(
      takeUntil(this.destroy$),
      share(),
    );
  }

  /**
   * Emits a document status update event to the customer's waiting room.
   * Called by OperatorService after approve/reject.
   */
  emitDocumentStatus(
    reservationId: string,
    status: DocumentStatus | "AWAITING_CAPTURE",
  ): void {
    const subject = this.reservationSubjects.get(reservationId);

    if (!subject) {
      this.logger.warn(
        `No SSE subscriber for reservation ${reservationId} — client may have disconnected.`,
      );
      return;
    }

    subject.next({
      data: this.buildCustomerReservationEvent(
        "reservation.document.updated",
        reservationId,
        status,
      ),
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
    status: ReservationStatus | "AWAITING_CAPTURE",
  ): void {
    const subject = this.reservationSubjects.get(reservationId);
    if (subject) {
      subject.next({
        data: this.buildCustomerReservationEvent(
          "reservation.status.updated",
          reservationId,
          status,
        ),
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
  subscribeOperatorChat(): Observable<LegacySseEvent | SseEvent> {
    const keepalive$ = interval(15_000).pipe(
      map(() => ({ data: this.buildKeepaliveEvent() })),
    );
    return merge(this.operatorChatSubject.asObservable(), keepalive$).pipe(
      takeUntil(this.destroy$),
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
      map(() => ({ data: this.buildKeepaliveEvent() })),
    );
    return merge(
      this.operatorDeliveriesSubject.asObservable(),
      keepalive$,
    ).pipe(takeUntil(this.destroy$), share());
  }

  /**
   * Called by OperatorDeliveryService after manualCheckin() or scanQr().
   * Broadcasts to all connected operators so their dashboards update.
   */
  emitDeliveryUpdate(reservationId: string, newStatus: string): void {
    this.operatorDeliveriesSubject.next({
      data: this.buildOperatorInvalidationEvent(
        "operator.deliveries.invalidated",
        reservationId,
      ),
    });
  }

  subscribeOperatorDocuments(): Observable<SseEvent> {
    const keepalive$ = interval(15_000).pipe(
      map(() => ({ data: this.buildKeepaliveEvent() })),
    );
    return merge(this.operatorDocumentsSubject.asObservable(), keepalive$).pipe(
      takeUntil(this.destroy$),
      share(),
    );
  }

  emitOperatorDocumentQueueInvalidation(resourceId: string): void {
    this.operatorDocumentsSubject.next({
      data: this.buildOperatorInvalidationEvent(
        "operator.documents.invalidated",
        resourceId,
      ),
    });
  }

  // ── Cleanup ──────────────────────────────────────────────────

  onModuleDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    for (const [id, subject] of this.reservationSubjects) {
      subject.complete();
    }
    this.reservationSubjects.clear();
    this.operatorChatSubject.complete();
    this.operatorDeliveriesSubject.complete();
    this.operatorDocumentsSubject.complete();
  }

  private buildKeepaliveEvent(): KeepaliveSseEventDto {
    return {
      type: "keepalive",
      updatedAt: new Date().toISOString(),
    };
  }

  private buildCustomerReservationEvent(
    type: CustomerReservationSseEventDto["type"],
    resourceId: string,
    status: CustomerReservationSseEventDto["status"],
  ): CustomerReservationSseEventDto {
    return {
      type,
      resourceId,
      status,
      updatedAt: new Date().toISOString(),
    };
  }

  private buildOperatorInvalidationEvent(
    type: OperatorInvalidationSseEventDto["type"],
    resourceId: string,
  ): OperatorInvalidationSseEventDto {
    return {
      type,
      resourceId,
      updatedAt: new Date().toISOString(),
    };
  }
}
