import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Reservation } from './reservation.entity';
import { Vehicle } from '../vehicles/vehicle.entity';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { StripeModule } from '../stripe/stripe.module';
import { QrModule } from '../qr/qr.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation, Vehicle]),
    BullModule.registerQueue({ name: 'reservation-expiry' }),
    StripeModule,
    QrModule,
  ],
  providers: [ReservationsService],
  controllers: [ReservationsController],
  exports: [ReservationsService],
})
export class ReservationsModule {}
