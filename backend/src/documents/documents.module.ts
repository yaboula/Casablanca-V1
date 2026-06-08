import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ReservationDocument } from './reservation-document.entity';
import { Reservation } from '../reservations/reservation.entity';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { DocumentCleanupProcessor } from './processors/document-cleanup.processor';
import { OrphanUploadCleanupProcessor } from './processors/orphan-upload-cleanup.processor';
import { S3Module } from '../s3/s3.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReservationDocument, Reservation]),
    BullModule.registerQueue({ name: 'document-cleanup' }),
    BullModule.registerQueue({ name: 'orphan-upload-cleanup' }),
    S3Module,
  ],
  providers: [
    DocumentsService,
    DocumentCleanupProcessor,
    OrphanUploadCleanupProcessor,
  ],
  controllers: [DocumentsController],
  exports: [DocumentsService],
})
export class DocumentsModule {}
