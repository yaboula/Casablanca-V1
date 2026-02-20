import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import {
  ReservationDocument,
  DocumentStatus,
} from '../reservation-document.entity';
import { S3Service } from '../../s3/s3.service';

export interface DocumentCleanupJobData {
  /** S3 fileKey of the rejected document (e.g. "docs/userId/resId/PASSPORT-ts.jpg") */
  fileKey: string;
  /** ReservationDocument UUID for idempotency check */
  documentId: string;
}

/**
 * BullMQ processor for the 'document-cleanup' queue.
 *
 * Triggered after an operator rejects a document (24-hour delay).
 * The delay window allows the customer to re-upload before S3 cleanup.
 *
 * Idempotent: if the customer has already re-uploaded and been approved,
 * the document status will no longer be REJECTED → we skip the S3 delete.
 */
@Processor('document-cleanup')
export class DocumentCleanupProcessor extends WorkerHost {
  private readonly logger = new Logger(DocumentCleanupProcessor.name);

  constructor(
    @InjectRepository(ReservationDocument)
    private readonly docsRepo: Repository<ReservationDocument>,
    private readonly s3Service: S3Service,
  ) {
    super();
  }

  async process(job: Job<DocumentCleanupJobData>): Promise<void> {
    const { fileKey, documentId } = job.data;

    this.logger.log(
      `[document-cleanup] Processing job ${job.id} — document ${documentId}`,
    );

    // ── Idempotency check ────────────────────────────────────
    // If the customer re-uploaded successfully (doc now APPROVED or
    // a new PENDING_REVIEW row exists), the old rejected doc row
    // may have been superseded. Only delete if still REJECTED.
    const doc = await this.docsRepo.findOne({ where: { id: documentId } });

    if (!doc) {
      this.logger.warn(
        `[document-cleanup] Document ${documentId} not found — skipping S3 delete.`,
      );
      return;
    }

    if (doc.status !== DocumentStatus.REJECTED) {
      this.logger.log(
        `[document-cleanup] Document ${documentId} status is ${doc.status} (not REJECTED) — skipping.`,
      );
      return;
    }

    // ── Delete S3 object ─────────────────────────────────────
    try {
      await this.s3Service.deleteObject(fileKey);
      this.logger.log(
        `[document-cleanup] Deleted S3 object: ${fileKey}`,
      );
    } catch (err: any) {
      // S3 NoSuchKey is safe to ignore; any other error will trigger BullMQ retry
      if (err?.Code === 'NoSuchKey' || err?.name === 'NoSuchKey') {
        this.logger.warn(
          `[document-cleanup] S3 object ${fileKey} already deleted — no-op.`,
        );
        return;
      }
      throw err;
    }
  }
}
