import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Reservation } from '../reservations/reservation.entity';
import { ReservationDocument } from '../documents/reservation-document.entity';
import { OperatorService } from './operator.service';
import { OperatorController } from './operator.controller';
import { CaptureStripeProcessor } from './processors/capture-stripe.processor';
import { ReservationExpiryProcessor } from './processors/reservation-expiry.processor';
import { QrModule } from '../qr/qr.module';
import { SseModule } from '../sse/sse.module';
import { StripeModule } from '../stripe/stripe.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation, ReservationDocument]),
    BullModule.registerQueue(
      { name: 'capture-stripe' },
      { name: 'reservation-expiry' },
      { name: 'document-cleanup' },
    ),
    QrModule,
    SseModule,
    StripeModule,
  ],
  providers: [OperatorService, CaptureStripeProcessor, ReservationExpiryProcessor],
  controllers: [OperatorController],
  exports: [OperatorService],
})
export class OperatorModule {}
