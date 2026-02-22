import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;
  private readonly webhookSecret: string;

  constructor(private readonly config: ConfigService) {
    this.stripe = new Stripe(this.config.get<string>("STRIPE_SECRET_KEY")!, {
      apiVersion: "2023-10-16",
      typescript: true,
    });
    this.webhookSecret = this.config.get<string>("STRIPE_WEBHOOK_SECRET")!;
  }

  /**
   * Creates a Payment Intent with capture_method: 'manual' (authorize only).
   * The actual capture happens later via BullMQ capture-stripe job.
   *
   * @param amountCents  Amount in EUR cents (e.g., 1000 = 10 €)
   * @param reservationId  Used as idempotency key prefix
   * @param metadata  Arbitrary metadata attached to the PI
   */
  async createPaymentIntent(
    amountCents: number,
    reservationId: string,
    metadata: Record<string, string> = {},
  ): Promise<Stripe.PaymentIntent> {
    return this.stripe.paymentIntents.create(
      {
        amount: amountCents,
        currency: "eur",
        capture_method: "manual",
        metadata: {
          reservationId,
          ...metadata,
        },
        description: `NEXUS deposit — reservation ${reservationId}`,
      },
      {
        // Idempotency key ensures duplicated requests don't create two PIs
        idempotencyKey: `pi-create-${reservationId}`,
      },
    );
  }

  /**
   * Captures an already-authorized Payment Intent.
   * Called exclusively from the BullMQ capture-stripe processor.
   */
  async capturePaymentIntent(
    paymentIntentId: string,
  ): Promise<Stripe.PaymentIntent> {
    return this.stripe.paymentIntents.capture(paymentIntentId, undefined, {
      idempotencyKey: `pi-capture-${paymentIntentId}`,
    });
  }

  /**
   * Cancels an authorized (but not captured) Payment Intent.
   * Used when reservation expires or is cancelled before capture.
   */
  async cancelPaymentIntent(
    paymentIntentId: string,
  ): Promise<Stripe.PaymentIntent> {
    return this.stripe.paymentIntents.cancel(paymentIntentId);
  }

  /**
   * Refunds a captured Payment Intent.
   * Used when an Operator cancels a CONFIRMED reservation.
   *
   * @param paymentIntentId The ID of the Payment Intent to refund
   */
  async refundPaymentIntent(paymentIntentId: string): Promise<Stripe.Refund> {
    return this.stripe.refunds.create(
      { payment_intent: paymentIntentId },
      { idempotencyKey: `pi-refund-${paymentIntentId}` },
    );
  }

  /**
   * Verifies Stripe webhook signature and returns the parsed event.
   * Throws if signature is invalid (tampered request).
   *
   * @param rawBody  Raw Buffer (requires app rawBody:true in main.ts)
   * @param signature  Value of stripe-signature HTTP header
   */
  constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      this.webhookSecret,
    );
  }
}
