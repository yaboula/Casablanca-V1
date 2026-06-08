import { Processor, WorkerHost, OnWorkerEvent } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Logger } from "@nestjs/common";
import {
  Reservation,
  ReservationStatus,
} from "../../reservations/reservation.entity";
import { isReservationTransitionAllowed } from "../../reservations/reservation-policy";
import { StripeService } from "../../stripe/stripe.service";
import { SseService } from "../../sse/sse.service";

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
@Processor("capture-stripe")
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
    this.logger.log(
      `Processing capture-stripe job for reservation ${reservationId}`,
    );

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

    // BYPASS_STRIPE: skip real Stripe call for dev/test mocked PIs
    const isMockedPI =
      reservation.stripePaymentIntentId.startsWith("pi_dev_mock_") ||
      reservation.stripePaymentIntentId.startsWith("pi_test_mock_");

    if (!isMockedPI) {
      // Capture the payment — if Stripe throws, BullMQ will retry
      await this.stripeService.capturePaymentIntent(
        reservation.stripePaymentIntentId,
      );
    } else {
      this.logger.log(
        `Skipping Stripe capture for mocked PI ${reservation.stripePaymentIntentId}`,
      );
    }

    // Update reservation to CONFIRMED
    if (
      !isReservationTransitionAllowed(
        reservation.status,
        ReservationStatus.CONFIRMED,
      )
    ) {
      throw new Error(
        `Invalid reservation transition ${reservation.status} -> ${ReservationStatus.CONFIRMED}`,
      );
    }

    await this.reservationsRepo.update(
      { id: reservation.id },
      { status: ReservationStatus.CONFIRMED },
    );

    this.logger.log(
      `Reservation ${reservationId} captured and set to CONFIRMED.`,
    );

    // SSE: notify customer — reservation is now CONFIRMED (QR active)
    // BUG-04 fix: was emitting DOCUMENT_STATUS_UPDATE instead of RESERVATION_STATUS_UPDATE
    this.sseService.emitReservationStatus(
      reservationId,
      ReservationStatus.CONFIRMED,
    );
  }

  /**
   * BUG-10 fix: Compensation when ALL retries are exhausted.
   * Rolls back reservation from AWAITING_CAPTURE → CANCELLED so
   * the customer isn't stuck in a phantom state forever.
   */
  @OnWorkerEvent("failed")
  async onFailed(job: Job<CaptureStripeJobData>, error: Error): Promise<void> {
    const maxAttempts = job.opts?.attempts ?? 1;
    if (job.attemptsMade < maxAttempts) {
      // Still has retries left — let BullMQ handle it
      return;
    }

    const { reservationId } = job.data;
    this.logger.error(
      `capture-stripe PERMANENTLY FAILED for reservation ${reservationId} after ${job.attemptsMade} attempts: ${error.message}`,
    );

    // Compensate: revert reservation to CANCELLED
    const updated = await this.reservationsRepo.update(
      { id: reservationId, status: ReservationStatus.AWAITING_CAPTURE },
      { status: ReservationStatus.CANCELLED },
    );

    if (updated.affected && updated.affected > 0) {
      this.logger.warn(
        `Reservation ${reservationId} compensated → CANCELLED after capture failure.`,
      );
      this.sseService.emitReservationStatus(
        reservationId,
        ReservationStatus.CANCELLED,
      );
    }
  }
}
