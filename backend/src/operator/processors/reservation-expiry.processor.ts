import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import { Reservation, ReservationStatus } from '../../reservations/reservation.entity';
import { isReservationTransitionAllowed } from '../../reservations/reservation-policy';
import { StripeService } from '../../stripe/stripe.service';

interface ReservationExpiryJobData {
  reservationId: string;
}

/**
 * BullMQ processor for the 'reservation-expiry' queue.
 *
 * Runs 15 minutes after reservation creation.
 * If the reservation is still PENDING_DEPOSIT (customer didn't pay), cancel it.
 *
 * Race condition safe: uses pessimistic_write WITH status in WHERE clause.
 * If Stripe webhook already confirmed the reservation, query returns null → processor exits.
 */
@Processor('reservation-expiry')
export class ReservationExpiryProcessor extends WorkerHost {
  private readonly logger = new Logger(ReservationExpiryProcessor.name);

  constructor(
    @InjectRepository(Reservation)
    private readonly reservationsRepo: Repository<Reservation>,
    private readonly dataSource: DataSource,
    private readonly stripeService: StripeService,
  ) {
    super();
  }

  async process(job: Job<ReservationExpiryJobData>): Promise<void> {
    const { reservationId } = job.data;
    this.logger.log(`Checking expiry for reservation ${reservationId}`);

    let stripePaymentIntentId: string | null = null;

    await this.dataSource.transaction(async (manager) => {
      // ✅ Correct pattern: status in WHERE + pessimistic_write
      // → Atomic check-and-lock. If webhook changed status, this returns null.
      const reservation = await manager
        .getRepository(Reservation)
        .findOne({
          where: {
            id: reservationId,
            status: ReservationStatus.PENDING_DEPOSIT,
          },
          lock: { mode: 'pessimistic_write' },
        });

      // Not in PENDING_DEPOSIT → already processed by webhook or operator
      if (!reservation) {
        this.logger.log(
          `Reservation ${reservationId} is no longer PENDING_DEPOSIT — skipping expiry.`,
        );
        return;
      }

      stripePaymentIntentId = reservation.stripePaymentIntentId;
      if (
        !isReservationTransitionAllowed(
          reservation.status,
          ReservationStatus.CANCELLED,
        )
      ) {
        throw new Error(
          `Invalid reservation transition ${reservation.status} -> ${ReservationStatus.CANCELLED}`,
        );
      }

      // Cancel the reservation inside the transaction
      await manager.getRepository(Reservation).update(
        { id: reservationId },
        { status: ReservationStatus.CANCELLED },
      );

      this.logger.log(`Reservation ${reservationId} expired and cancelled.`);
    });

    // Cancel the Stripe PI outside the transaction (external HTTP call)
    if (stripePaymentIntentId) {
      try {
        await this.stripeService.cancelPaymentIntent(stripePaymentIntentId);
        this.logger.log(
          `Stripe PI ${stripePaymentIntentId} cancelled for expired reservation ${reservationId}.`,
        );
      } catch (err) {
        this.logger.error(
          `Failed to cancel Stripe PI ${stripePaymentIntentId}`,
          err,
        );
        // Do not throw — reservation is already CANCELLED in DB.
        // Stripe will auto-release the authorization after ~7 days.
      }
    }
  }
}
