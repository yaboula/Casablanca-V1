import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import Stripe from 'stripe';
import { StripeWebhookLog } from './entities/stripe-webhook-log.entity';
import {
  DepositRefundStatus,
  DepositStatus,
  Reservation,
  ReservationStatus,
} from '../reservations/reservation.entity';
import { isReservationTransitionAllowed } from '../reservations/reservation-policy';
import { SseService } from '../sse/sse.service';

const WEBHOOK_CANCELLATION_STATUSES: readonly ReservationStatus[] = [
  ReservationStatus.PENDING_DEPOSIT,
  ReservationStatus.AWAITING_CAPTURE,
];

/**
 * Processes Stripe webhook events with full idempotency.
 *
 * Idempotency pattern:
 *  1. INSERT stripe_webhook_logs (event_id PK).
 *  2. Duplicate-key error (PG code 23505) → event already processed, skip.
 *  3. Handle event, update reservation inside the SAME transaction.
 *  4. Commit → mark log.processed = true.
 *
 * This makes every Stripe retry safe under at-least-once delivery.
 */
@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectRepository(StripeWebhookLog)
    private readonly logsRepo: Repository<StripeWebhookLog>,
    @InjectRepository(Reservation)
    private readonly reservationsRepo: Repository<Reservation>,
    private readonly dataSource: DataSource,
    private readonly sseService: SseService,
  ) {}

  /**
   * Main entry point — dispatches to the correct handler.
   * All DB work runs inside a single transaction for atomicity.
   */
  async handleEvent(event: Stripe.Event): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // ── Idempotency INSERT ───────────────────────────────────
      try {
        await queryRunner.manager.insert(StripeWebhookLog, {
          eventId: event.id,
          eventType: event.type,
          processed: false,
          error: null,
        });
      } catch (dupErr: any) {
        // PostgreSQL unique_violation — event already processed
        if (dupErr?.code === '23505') {
          this.logger.debug(
            `Stripe event ${event.id} (${event.type}) already processed — skipping.`,
          );
          await queryRunner.rollbackTransaction();
          return;
        }
        throw dupErr;
      }

      // ── Dispatch ─────────────────────────────────────────────
      const manager = queryRunner.manager;
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.onPaymentIntentSucceeded(
            event.data.object as Stripe.PaymentIntent,
            manager,
          );
          break;

        case 'payment_intent.payment_failed':
          await this.onPaymentIntentFailed(
            event.data.object as Stripe.PaymentIntent,
            manager,
          );
          break;

        case 'payment_intent.canceled':
          await this.onPaymentIntentCanceled(
            event.data.object as Stripe.PaymentIntent,
            manager,
          );
          break;

        default:
          this.logger.debug(`Unhandled Stripe event type: ${event.type}`);
      }

      // ── Mark processed ───────────────────────────────────────
      await queryRunner.manager.update(
        StripeWebhookLog,
        { eventId: event.id },
        { processed: true },
      );

      await queryRunner.commitTransaction();
    } catch (err: any) {
      await queryRunner.rollbackTransaction();

      // Persist error for debugging (outside the rolled-back tx)
      await this.logsRepo
        .update({ eventId: event.id }, { error: err?.message ?? String(err) })
        .catch(() => {}); // swallow — log row may not exist on INSERT fail

      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // ── Private handlers ──────────────────────────────────────────

  /**
   * payment_intent.succeeded
   *
   * Stripe emits this after a successful capture.
   * Our BullMQ capture-stripe processor normally handles this transition,
   * but this webhook acts as a safety-net (idempotent):
   * if BullMQ failed permanently, we set CONFIRMED here.
   */
  private async onPaymentIntentSucceeded(
    pi: Stripe.PaymentIntent,
    manager: EntityManager,
  ): Promise<void> {
    const reservation = await manager
      .getRepository(Reservation)
      .findOne({ where: { stripePaymentIntentId: pi.id } });

    if (!reservation) {
      this.logger.warn(`[webhook] payment_intent.succeeded — no reservation found for PI ${pi.id}`);
      return;
    }

    // Safety-net: only transition if BullMQ hasn't done it already
    if (
      isReservationTransitionAllowed(
        reservation.status,
        ReservationStatus.CONFIRMED,
      )
    ) {
      await manager
        .getRepository(Reservation)
        .update(
          { id: reservation.id },
          {
            status: ReservationStatus.CONFIRMED,
            depositStatus: DepositStatus.CAPTURED,
            depositCapturedAt: new Date(),
            depositLastFailureAt: null,
            depositLastFailureReason: null,
            depositRefundStatus: DepositRefundStatus.NOT_REQUESTED,
            depositRefundAttemptedAt: null,
            depositRefundFailureAt: null,
            depositRefundFailureReason: null,
          },
        );

      this.sseService.emitReservationStatus(
        reservation.id,
        ReservationStatus.CONFIRMED,
      );
      this.logger.log(
        `[webhook] safety-net: reservation ${reservation.id} → CONFIRMED`,
      );
    }
  }

  /**
   * payment_intent.payment_failed
   * Customer's card was declined. Cancel the reservation.
   */
  private async onPaymentIntentFailed(
    pi: Stripe.PaymentIntent,
    manager: EntityManager,
  ): Promise<void> {
    const reservation = await manager
      .getRepository(Reservation)
      .findOne({ where: { stripePaymentIntentId: pi.id } });

    if (!reservation) return;

    if (WEBHOOK_CANCELLATION_STATUSES.includes(reservation.status)) {
      const failureReason =
        pi.last_payment_error?.message ?? 'Stripe reported deposit payment failure.';
      await manager
        .getRepository(Reservation)
        .update(
          { id: reservation.id },
          {
            status: ReservationStatus.CANCELLED,
            depositStatus: DepositStatus.FAILED,
            depositLastFailureAt: new Date(),
            depositLastFailureReason: failureReason,
            depositRefundStatus: DepositRefundStatus.NOT_APPLICABLE,
          },
        );

      this.sseService.emitReservationStatus(
        reservation.id,
        ReservationStatus.CANCELLED,
      );
      this.logger.log(
        `[webhook] payment_intent.payment_failed: reservation ${reservation.id} → CANCELLED`,
      );
    }
  }

  /**
   * payment_intent.canceled
   * PI was cancelled (by our expiry processor or manually).
   * Idempotent — reservation may already be CANCELLED by the expiry processor.
   */
  private async onPaymentIntentCanceled(
    pi: Stripe.PaymentIntent,
    manager: EntityManager,
  ): Promise<void> {
    const reservation = await manager
      .getRepository(Reservation)
      .findOne({ where: { stripePaymentIntentId: pi.id } });

    if (!reservation) return;

    if (WEBHOOK_CANCELLATION_STATUSES.includes(reservation.status)) {
      await manager
        .getRepository(Reservation)
        .update(
          { id: reservation.id },
          {
            status: ReservationStatus.CANCELLED,
            depositStatus: DepositStatus.CANCELLED,
            depositRefundStatus: DepositRefundStatus.NOT_APPLICABLE,
          },
        );

      this.sseService.emitReservationStatus(
        reservation.id,
        ReservationStatus.CANCELLED,
      );
      this.logger.log(
        `[webhook] payment_intent.canceled: reservation ${reservation.id} → CANCELLED`,
      );
    }
  }
}
