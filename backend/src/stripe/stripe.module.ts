import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StripeService } from './stripe.service';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { StripeWebhookLog } from './entities/stripe-webhook-log.entity';
import { Reservation } from '../reservations/reservation.entity';
import { SseModule } from '../sse/sse.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StripeWebhookLog, Reservation]),
    SseModule,
  ],
  providers: [StripeService, WebhooksService],
  controllers: [WebhooksController],
  exports: [StripeService],
})
export class StripeModule {}
