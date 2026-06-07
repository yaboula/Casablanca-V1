import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BullModule } from "@nestjs/bullmq";
import { Reservation } from "../reservations/reservation.entity";
import { ReservationDocument } from "../documents/reservation-document.entity";
import { Vehicle } from "../vehicles/vehicle.entity";
import { AuditLog } from "./audit-log.entity";
import { OperatorService } from "./operator.service";
import { OperatorController } from "./operator.controller";
import { CaptureStripeProcessor } from "./processors/capture-stripe.processor";
import { ReservationExpiryProcessor } from "./processors/reservation-expiry.processor";
import { QrModule } from "../qr/qr.module";
import { SseModule } from "../sse/sse.module";
import { StripeModule } from "../stripe/stripe.module";
import { S3Module } from "../s3/s3.module";
import { OperatorDeliveryService } from "./services/operator-delivery.service";
import { OperatorDocumentService } from "./services/operator-document.service";
import { OperatorSearchService } from "./services/operator-search.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Reservation,
      ReservationDocument,
      Vehicle,
      AuditLog,
    ]),
    BullModule.registerQueue(
      { name: "capture-stripe" },
      { name: "reservation-expiry" },
      { name: "document-cleanup" },
    ),
    QrModule,
    SseModule,
    StripeModule,
    S3Module,
  ],
  providers: [
    // Sub-services (SRP)
    OperatorDeliveryService,
    OperatorDocumentService,
    OperatorSearchService,
    // Facade (backwards-compatible public API)
    OperatorService,
    CaptureStripeProcessor,
    ReservationExpiryProcessor,
  ],
  controllers: [OperatorController],
  exports: [OperatorService],
})
export class OperatorModule {}
