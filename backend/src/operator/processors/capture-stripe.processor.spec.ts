import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  DepositRefundStatus,
  DepositStatus,
  Reservation,
  ReservationStatus,
} from '../../reservations/reservation.entity';
import { StripeService } from '../../stripe/stripe.service';
import { SseService } from '../../sse/sse.service';
import { CaptureStripeProcessor } from './capture-stripe.processor';

function makeReservation(
  status: ReservationStatus = ReservationStatus.AWAITING_CAPTURE,
  overrides: Partial<Reservation> = {},
): Reservation {
  return {
    id: 'res-123',
    status,
    stripePaymentIntentId: 'pi_test',
    depositStatus: DepositStatus.CAPTURE_QUEUED,
    depositRefundStatus: DepositRefundStatus.NOT_APPLICABLE,
    ...overrides,
  } as Reservation;
}

describe('CaptureStripeProcessor', () => {
  let processor: CaptureStripeProcessor;

  const mockReservationsRepo = {
    findOne: jest.fn(),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
  };

  const mockStripeService = {
    capturePaymentIntent: jest.fn().mockResolvedValue({ id: 'pi_test' }),
  };

  const mockSseService = {
    emitReservationStatus: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CaptureStripeProcessor,
        {
          provide: getRepositoryToken(Reservation),
          useValue: mockReservationsRepo,
        },
        { provide: StripeService, useValue: mockStripeService },
        { provide: SseService, useValue: mockSseService },
      ],
    }).compile();

    processor = module.get(CaptureStripeProcessor);
  });

  it('captures and confirms a reservation in AWAITING_CAPTURE', async () => {
    mockReservationsRepo.findOne.mockResolvedValue(
      makeReservation(ReservationStatus.AWAITING_CAPTURE),
    );

    await processor.process({ data: { reservationId: 'res-123' } } as any);

    expect(mockStripeService.capturePaymentIntent).toHaveBeenCalledWith('pi_test');
    expect(mockReservationsRepo.update).toHaveBeenCalledWith(
      { id: 'res-123' },
      expect.objectContaining({
        status: ReservationStatus.CONFIRMED,
        depositStatus: DepositStatus.CAPTURED,
        depositRefundStatus: DepositRefundStatus.NOT_REQUESTED,
      }),
    );
    expect(mockSseService.emitReservationStatus).toHaveBeenCalledWith(
      'res-123',
      ReservationStatus.CONFIRMED,
    );
  });

  it('skips already-processed reservations outside AWAITING_CAPTURE', async () => {
    mockReservationsRepo.findOne.mockResolvedValue(null);

    await expect(
      processor.process({ data: { reservationId: 'res-123' } } as any),
    ).resolves.toBeUndefined();

    expect(mockStripeService.capturePaymentIntent).not.toHaveBeenCalled();
    expect(mockReservationsRepo.update).not.toHaveBeenCalled();
  });

  it('compensates to CANCELLED only after final failure', async () => {
    await processor.onFailed(
      {
        data: { reservationId: 'res-123' },
        attemptsMade: 5,
        opts: { attempts: 5 },
      } as any,
      new Error('capture failed'),
    );

    expect(mockReservationsRepo.update).toHaveBeenCalledWith(
      { id: 'res-123', status: ReservationStatus.AWAITING_CAPTURE },
      expect.objectContaining({
        status: ReservationStatus.CANCELLED,
        depositStatus: DepositStatus.FAILED,
        depositLastFailureReason: 'capture failed',
      }),
    );
    expect(mockSseService.emitReservationStatus).toHaveBeenCalledWith(
      'res-123',
      ReservationStatus.CANCELLED,
    );
  });

  it('does not compensate while retries remain', async () => {
    await processor.onFailed(
      {
        data: { reservationId: 'res-123' },
        attemptsMade: 1,
        opts: { attempts: 5 },
      } as any,
      new Error('capture failed'),
    );

    expect(mockReservationsRepo.update).not.toHaveBeenCalled();
    expect(mockSseService.emitReservationStatus).not.toHaveBeenCalled();
  });
});
