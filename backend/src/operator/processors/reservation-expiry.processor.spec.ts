import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  DepositRefundStatus,
  DepositStatus,
  Reservation,
  ReservationStatus,
} from '../../reservations/reservation.entity';
import { StripeService } from '../../stripe/stripe.service';
import { ReservationExpiryProcessor } from './reservation-expiry.processor';

function makeReservation(
  status: ReservationStatus = ReservationStatus.PENDING_DEPOSIT,
  overrides: Partial<Reservation> = {},
): Reservation {
  return {
    id: 'res-123',
    status,
    stripePaymentIntentId: 'pi_test',
    depositStatus: DepositStatus.PENDING,
    depositRefundStatus: DepositRefundStatus.NOT_APPLICABLE,
    ...overrides,
  } as Reservation;
}

describe('ReservationExpiryProcessor', () => {
  let processor: ReservationExpiryProcessor;

  const mockReservationsRepo = {};
  const mockStripeService = {
    cancelPaymentIntent: jest.fn().mockResolvedValue({ id: 'pi_test' }),
  };

  const manager = {
    getRepository: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn().mockImplementation(async (cb: (manager: any) => Promise<void>) => {
      await cb(manager);
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationExpiryProcessor,
        { provide: getRepositoryToken(Reservation), useValue: mockReservationsRepo },
        { provide: DataSource, useValue: mockDataSource },
        { provide: StripeService, useValue: mockStripeService },
      ],
    }).compile();

    processor = module.get(ReservationExpiryProcessor);
  });

  it('cancels a pending reservation and then cancels the Stripe payment intent', async () => {
    const findOne = jest.fn().mockResolvedValue(
      makeReservation(ReservationStatus.PENDING_DEPOSIT),
    );
    const update = jest.fn().mockResolvedValue({ affected: 1 });
    manager.getRepository.mockReturnValue({ findOne, update });

    await processor.process({ data: { reservationId: 'res-123' } } as any);

    expect(update).toHaveBeenCalledWith(
      { id: 'res-123' },
      expect.objectContaining({
        status: ReservationStatus.CANCELLED,
        depositStatus: DepositStatus.CANCELLED,
        depositRefundStatus: DepositRefundStatus.NOT_APPLICABLE,
      }),
    );
    expect(mockStripeService.cancelPaymentIntent).toHaveBeenCalledWith('pi_test');
  });

  it('skips when the reservation is no longer pending', async () => {
    const findOne = jest.fn().mockResolvedValue(null);
    const update = jest.fn().mockResolvedValue({ affected: 1 });
    manager.getRepository.mockReturnValue({ findOne, update });

    await processor.process({ data: { reservationId: 'res-123' } } as any);

    expect(update).not.toHaveBeenCalled();
    expect(mockStripeService.cancelPaymentIntent).not.toHaveBeenCalled();
  });

  it('does not throw if Stripe cancellation fails after DB cancellation', async () => {
    const findOne = jest.fn().mockResolvedValue(
      makeReservation(ReservationStatus.PENDING_DEPOSIT),
    );
    const update = jest.fn().mockResolvedValue({ affected: 1 });
    manager.getRepository.mockReturnValue({ findOne, update });
    mockStripeService.cancelPaymentIntent.mockRejectedValueOnce(
      new Error('stripe unavailable'),
    );

    await expect(
      processor.process({ data: { reservationId: 'res-123' } } as any),
    ).resolves.toBeUndefined();

    expect(update).toHaveBeenCalled();
  });
});
