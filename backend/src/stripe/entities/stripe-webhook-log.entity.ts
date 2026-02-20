import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

/**
 * Idempotency log for Stripe webhook events.
 *
 * Strategy:
 *  1. Before processing, INSERT the event ID (PK — unique by design).
 *  2. If INSERT throws a duplicate-key error (code 23505), this event was
 *     already handled → return 200 to Stripe without re-processing.
 *  3. On success, flip processed = true inside the SAME DB transaction.
 *  4. On failure, update error column outside the rolled-back tx for debugging.
 *
 * This guarantees exactly-once processing semantics for Stripe's
 * at-least-once delivery model.
 */
@Entity('stripe_webhook_logs')
export class StripeWebhookLog {
  /** Stripe globally unique event ID (e.g. "evt_1...") — our idempotency key */
  @PrimaryColumn({ name: 'event_id', length: 100 })
  eventId: string;

  @Column({ name: 'event_type', length: 80 })
  eventType: string;

  /** true when the handler completed without error and transaction was committed */
  @Column({ name: 'processed', default: false })
  processed: boolean;

  /** Last error message if the handler threw an exception */
  @Column({ name: 'error', type: 'text', nullable: true })
  error: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
