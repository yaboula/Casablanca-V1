import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import Stripe from 'stripe';
import { Reservation, ReservationStatus } from '../reservations/reservation.entity';
import { SseService } from '../sse/sse.service';
import { StripeWebhookLog } from './entities/stripe-webhook-log.entity';
import { WebhooksService } from './webhooks.service';

function makeStripeEvent(
  type: string,
  piId: string,
  overrides: Partial<Stripe.Event> = {},
): Stripe.Event {
  return {
    id: `evt_${Math.random().toString(36).slice(2)}`,
    type: type as any,
    data: {
      object: {
        id: piId,
        object: 'payment_intent',
      } as any,
    },
    object: 'event',
    api_version: '2023-10-16',
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    pending_webhooks: 1,
    request: null,
    ...overrides,
  } as Stripe.Event;
}

function makeReservation(
  status: ReservationStatus = ReservationStatus.AWAITING_CAPTURE,
): Reservation {
  return {
    id: 'res-123',
    stripePaymentIntentId: 'pi_test',
    status,
  } as Reservation;
}

describe('WebhooksService', () => {
  let service: WebhooksService;

  const mockLogsRepo = {
    update: jest.fn().mockResolvedValue({}),
  };

  const mockReservationsRepo = {};

  const mockSseService = {
    emitReservationStatus: jest.fn(),
  };

  const makeQueryRunner = (opts: {
    duplicateKey?: boolean;
    reservation?: Reservation | null;
  }) => ({
    connect: jest.fn().mockResolvedValue(undefined),
    startTransaction: jest.fn().mockResolvedValue(undefined),
    commitTransaction: jest.fn().mockResolvedValue(undefined),
    rollbackTransaction: jest.fn().mockResolvedValue(undefined),
    release: jest.fn().mockResolvedValue(undefined),
    manager: {
      insert: jest.fn().mockImplementation(() => {
        if (opts.duplicateKey) {
          const err: any = new Error('duplicate key');
          err.code = '23505';
          return Promise.reject(err);
        }
        return Promise.resolve({});
      }),
      update: jest.fn().mockResolvedValue({}),
      getRepository: jest.fn().mockReturnValue({
        findOne: jest.fn().mockResolvedValue(opts.reservation ?? null),
        update: jest.fn().mockResolvedValue({}),
      }),
    },
  });

  const mockDataSource = {
    createQueryRunner: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksService,
        { provide: getRepositoryToken(StripeWebhookLog), useValue: mockLogsRepo },
        { provide: getRepositoryToken(Reservation), useValue: mockReservationsRepo },
        { provide: DataSource, useValue: mockDataSource },
        { provide: SseService, useValue: mockSseService },
      ],
    }).compile();

    service = module.get(WebhooksService);
  });

  describe('idempotency', () => {
    it('skips duplicate event IDs safely', async () => {
      const qr = makeQueryRunner({ duplicateKey: true });
      mockDataSource.createQueryRunner.mockReturnValue(qr);

      await expect(
        service.handleEvent(makeStripeEvent('payment_intent.succeeded', 'pi_test')),
      ).resolves.toBeUndefined();

      expect(qr.rollbackTransaction).toHaveBeenCalled();
      expect(qr.commitTransaction).not.toHaveBeenCalled();
    });
  });

  describe('payment_intent.succeeded', () => {
    it('moves AWAITING_CAPTURE to CONFIRMED', async () => {
      const reservation = makeReservation(ReservationStatus.AWAITING_CAPTURE);
      const qr = makeQueryRunner({ reservation });
      mockDataSource.createQueryRunner.mockReturnValue(qr);

      await service.handleEvent(
        makeStripeEvent('payment_intent.succeeded', 'pi_test'),
      );

      expect(mockSseService.emitReservationStatus).toHaveBeenCalledWith(
        reservation.id,
        ReservationStatus.CONFIRMED,
      );
      expect(qr.commitTransaction).toHaveBeenCalled();
    });

    it('does nothing if the reservation is already CONFIRMED', async () => {
      const qr = makeQueryRunner({
        reservation: makeReservation(ReservationStatus.CONFIRMED),
      });
      mockDataSource.createQueryRunner.mockReturnValue(qr);

      await service.handleEvent(
        makeStripeEvent('payment_intent.succeeded', 'pi_test'),
      );

      expect(mockSseService.emitReservationStatus).not.toHaveBeenCalled();
      expect(qr.commitTransaction).toHaveBeenCalled();
    });

    it('does nothing if no reservation exists for the PI', async () => {
      const qr = makeQueryRunner({ reservation: null });
      mockDataSource.createQueryRunner.mockReturnValue(qr);

      await expect(
        service.handleEvent(makeStripeEvent('payment_intent.succeeded', 'pi_unknown')),
      ).resolves.toBeUndefined();

      expect(qr.commitTransaction).toHaveBeenCalled();
    });
  });

  describe('payment_intent.payment_failed', () => {
    it('cancels a PENDING_DEPOSIT reservation', async () => {
      const reservation = makeReservation(ReservationStatus.PENDING_DEPOSIT);
      const qr = makeQueryRunner({ reservation });
      mockDataSource.createQueryRunner.mockReturnValue(qr);

      await service.handleEvent(
        makeStripeEvent('payment_intent.payment_failed', 'pi_test'),
      );

      expect(mockSseService.emitReservationStatus).toHaveBeenCalledWith(
        reservation.id,
        ReservationStatus.CANCELLED,
      );
      expect(qr.commitTransaction).toHaveBeenCalled();
    });

    it('does nothing if the reservation is already CONFIRMED', async () => {
      const qr = makeQueryRunner({
        reservation: makeReservation(ReservationStatus.CONFIRMED),
      });
      mockDataSource.createQueryRunner.mockReturnValue(qr);

      await service.handleEvent(
        makeStripeEvent('payment_intent.payment_failed', 'pi_test'),
      );

      expect(mockSseService.emitReservationStatus).not.toHaveBeenCalled();
      expect(qr.commitTransaction).toHaveBeenCalled();
    });
  });

  describe('payment_intent.canceled', () => {
    it('cancels an AWAITING_CAPTURE reservation', async () => {
      const reservation = makeReservation(ReservationStatus.AWAITING_CAPTURE);
      const qr = makeQueryRunner({ reservation });
      mockDataSource.createQueryRunner.mockReturnValue(qr);

      await service.handleEvent(
        makeStripeEvent('payment_intent.canceled', 'pi_test'),
      );

      expect(mockSseService.emitReservationStatus).toHaveBeenCalledWith(
        reservation.id,
        ReservationStatus.CANCELLED,
      );
      expect(qr.commitTransaction).toHaveBeenCalled();
    });

    it('does nothing if the reservation is already CANCELLED', async () => {
      const qr = makeQueryRunner({
        reservation: makeReservation(ReservationStatus.CANCELLED),
      });
      mockDataSource.createQueryRunner.mockReturnValue(qr);

      await service.handleEvent(
        makeStripeEvent('payment_intent.canceled', 'pi_test'),
      );

      expect(mockSseService.emitReservationStatus).not.toHaveBeenCalled();
      expect(qr.commitTransaction).toHaveBeenCalled();
    });

    it('does nothing if the reservation is already CONFIRMED', async () => {
      const qr = makeQueryRunner({
        reservation: makeReservation(ReservationStatus.CONFIRMED),
      });
      mockDataSource.createQueryRunner.mockReturnValue(qr);

      await service.handleEvent(
        makeStripeEvent('payment_intent.canceled', 'pi_test'),
      );

      expect(mockSseService.emitReservationStatus).not.toHaveBeenCalled();
      expect(qr.commitTransaction).toHaveBeenCalled();
    });
  });
});
