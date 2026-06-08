import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { ReservationDocument } from '../reservation-document.entity';
import { S3Service } from '../../s3/s3.service';

export interface OrphanUploadCleanupJobData {
  fileKey: string;
}

@Processor('orphan-upload-cleanup')
export class OrphanUploadCleanupProcessor extends WorkerHost {
  private readonly logger = new Logger(OrphanUploadCleanupProcessor.name);

  constructor(
    @InjectRepository(ReservationDocument)
    private readonly docsRepo: Repository<ReservationDocument>,
    private readonly s3Service: S3Service,
  ) {
    super();
  }

  async process(job: Job<OrphanUploadCleanupJobData>): Promise<void> {
    const { fileKey } = job.data;
    this.logger.log(
      `[orphan-upload-cleanup] Processing job ${job.id} for ${fileKey}`,
    );

    const linkedDocument = await this.docsRepo.findOne({ where: { fileKey } });
    if (linkedDocument) {
      this.logger.log(
        `[orphan-upload-cleanup] File ${fileKey} is linked to document ${linkedDocument.id} - skipping.`,
      );
      return;
    }

    try {
      await this.s3Service.deleteObject(fileKey);
      this.logger.log(`[orphan-upload-cleanup] Deleted orphaned object ${fileKey}`);
    } catch (err: any) {
      if (err?.Code === 'NoSuchKey' || err?.name === 'NoSuchKey') {
        this.logger.warn(
          `[orphan-upload-cleanup] S3 object ${fileKey} already deleted - no-op.`,
        );
        return;
      }
      throw err;
    }
  }
}
