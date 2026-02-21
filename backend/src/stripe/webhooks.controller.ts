import {
  Controller,
  Post,
  Req,
  Headers,
  BadRequestException,
  Logger,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { StripeService } from './stripe.service';
import { WebhooksService } from './webhooks.service';

/**
 * POST /api/v1/webhooks/stripe
 *
 * Security model:
 *  - NO JwtAuthGuard — Stripe calls this from its own servers.
 *  - Authentication is done via Stripe signature verification (HMAC-SHA256).
 *  - If the signature is invalid → 400 (tampered / replay attack).
 *  - Rate limited: 20 requests/min per IP (‘webhook’ throttle tier)
 *    prevents DoS flood consuming HMAC verification CPU.
 *
 * Raw body requirement:
 *  - NestFactory.create() must have rawBody: true (already set in main.ts).
 *  - The Buffer is needed for constructWebhookEvent(); parsing the JSON
 *    first would destroy the byte-exact signature verification.
 *
 * Idempotency:
 *  - Stripe retries webhooks for up to 72 hours on any non-2xx response.
 *  - WebhooksService.handleEvent() deduplicates via stripe_webhook_logs PK.
 *  - Already-processed events return 200 without re-running the handler.
 */
@Controller('webhooks')
@UseGuards(ThrottlerGuard)
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly webhooksService: WebhooksService,
  ) {}

  @Post('stripe')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: boolean }> {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header.');
    }

    const rawBody = req.rawBody;
    if (!rawBody || !rawBody.length) {
      throw new BadRequestException(
        'Missing raw body — ensure rawBody:true in NestFactory.create().',
      );
    }

    let event: import('stripe').default.Event;
    try {
      event = this.stripeService.constructWebhookEvent(rawBody, signature);
    } catch (err: any) {
      this.logger.warn(`Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    this.logger.log(`Received Stripe event: ${event.type} [${event.id}]`);
    await this.webhooksService.handleEvent(event);

    return { received: true };
  }
}
