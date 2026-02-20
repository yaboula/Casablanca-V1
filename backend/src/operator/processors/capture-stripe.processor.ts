import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { Reservation, ReservationStatus } from '../../reservations/reservation.entity';
import { StripeService } from '../../stripe/stripe.service';
import { SseService } from '../../sse/sse.service';
import { DocumentStatus } from '../../documents/reservation-document.entity';

interface CaptureStripeJobData {
  reservationId: string;
}

/**
 * BullMQ processor for the 'capture-stripe' queue.
 *
 * Responsibility: Capture the Stripe PaymentIntent AFTER the DB transaction
 * that set reservation.status = AWAITING_CAPTURE has already committed.
 *
 * This processor is the ONLY place where Stripe capture happens.
 * Never call stripe.capture() inside a DB transaction.
 *
 * On success: reservation → CONFIRMED, SSE → APPROVED (QR now active)
 * On failure: BullMQ retries with exponential backoff (max 5 attempts)
 */
@Processor('capture-stripe')
export class CaptureStripeProcessor extends WorkerHost {
  private readonly logger = new Logger(CaptureStripeProcessor.name);

  constructor(
    @InjectRepository(Reservation)
    private readonly reservationsRepo: Repository<Reservation>,
    private readonly stripeService: StripeService,
    private readonly sseService: SseService,
  ) {
    super();
  }

  async process(job: Job<CaptureStripeJobData>): Promise<void> {
    const { reservationId } = job.data;
    this.logger.log(`Processing capture-stripe job for reservation ${reservationId}`);

    const reservation = await this.reservationsRepo.findOne({
      where: {
        id: reservationId,
        status: ReservationStatus.AWAITING_CAPTURE,
      },
    });

    // Idempotent exit: if not in AWAITING_CAPTURE, someone already processed this
    if (!reservation) {
      this.logger.warn(
        `Reservation ${reservationId} not in AWAITING_CAPTURE — skipping (already processed).`,
      );
      return;
    }

    if (!reservation.stripePaymentIntentId) {
      throw new Error(
        `Reservation ${reservationId} has no stripePaymentIntentId — cannot capture.`,
      );
    }

    // Capture the payment — if Stripe throws, BullMQ will retry
    await this.stripeService.capturePaymentIntent(
      reservation.stripePaymentIntentId,
    );

    // Update reservation to CONFIRMED
    await this.reservationsRepo.update(
      { id: reservation.id },
      { status: ReservationStatus.CONFIRMED },
    );

    this.logger.log(
      `Reservation ${reservationId} captured and set to CONFIRMED.`,
    );

    // SSE: notify customer — QR is now active
    this.sseService.emitDocumentStatus(
      reservationId,
      DocumentStatus.APPROVED, // triggers stream close on client
    );
  }
}
