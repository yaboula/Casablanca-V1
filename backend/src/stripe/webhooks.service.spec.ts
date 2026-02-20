import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { WebhooksService } from './webhooks.service';
import { StripeWebhookLog } from './entities/stripe-webhook-log.entity';
import { Reservation, ReservationStatus } from '../reservations/reservation.entity';
import { SseService } from '../sse/sse.service';
import Stripe from 'stripe';

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function makeReservation(status: ReservationStatus = ReservationStatus.AWAITING_CAPTURE) {
  return {
    id: 'res-123',
    stripePaymentIntentId: 'pi_test',
    status,
  } as Reservation;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('WebhooksService', () => {
  let service: WebhooksService;

  const mockLogsRepo = {
    update: jest.fn().mockResolvedValue({}),
  };

  const mockReservationsRepo = {};

  const mockSseService = {
    emitReservationStatus: jest.fn(),
  };

  // Each test configures its own QueryRunner via this factory
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

    service = module.get<WebhooksService>(WebhooksService);
  });

  // ── Idempotency ────────────────────────────────────────────────────────────

  describe('idempotency', () => {
    it('should skip (return early) and rollback on duplicate event ID', async () => {
      const qr = makeQueryRunner({ duplicateKey: true });
      mockDataSource.createQueryRunner.mockReturnValue(qr);

      const event = makeStripeEvent('payment_intent.succeeded', 'pi_test');

      // Should NOT throw — just skip
      await expect(service.handleEvent(event)).resolves.toBeUndefined();

      expect(qr.rollbackTransaction).toHaveBeenCalled();
      expect(qr.commitTransaction).not.toHaveBeenCalled();
    });
  });

  // ── payment_intent.succeeded ───────────────────────────────────────────────

  describe('payment_intent.succeeded', () => {
    it('should set AWAITING_CAPTURE reservation → CONFIRMED', async () => {
      const reservation = makeReservation(ReservationStatus.AWAITING_CAPTURE);
      const qr = makeQueryRunner({ reservation });
      mockDataSource.createQueryRunner.mockReturnValue(qr);

      const event = makeStripeEvent('payment_intent.succeeded', 'pi_test');
      await service.handleEvent(event);

      expect(qr.commitTransaction).toHaveBeenCalled();
      expect(mockSseService.emitReservationStatus).toHaveBeenCalledWith(
        reservation.id,
        ReservationStatus.CONFIRMED,
      );
    });

    it('should be a no-op if reservation is already CONFIRMED', async () => {
      const reservation = makeReservation(ReservationStatus.CONFIRMED);
      const qr = makeQueryRunner({ reservation });
      mockDataSource.createQueryRunner.mockReturnValue(qr);

      const event = makeStripeEvent('payment_intent.succeeded', 'pi_test');
      await service.handleEvent(event);

      // SSE should NOT be emitted again — prevents duplicate client notifications
      expect(mockSseService.emitReservationStatus).not.toHaveBeenCalled();
      expect(qr.commitTransaction).toHaveBeenCalled();
    });

    it('should no-op gracefully if no reservation found for PI', async () => {
      const qr = makeQueryRunner({ reservation: null });
      mockDataSource.createQueryRunner.mockReturnValue(qr);

      const event = makeStripeEvent('payment_intent.succeeded', 'pi_unknown');
      await expect(service.handleEvent(event)).resolves.toBeUndefined();
      expect(qr.commitTransaction).toHaveBeenCalled();
    });
  });

  // ── payment_intent.payment_failed ─────────────────────────────────────────

  describe('payment_intent.payment_failed', () => {
    it('should set PENDING_DEPOSIT → CANCELLED on payment failure', async () => {
      const reservation = makeReservation(ReservationStatus.PENDING_DEPOSIT);
      const qr = makeQueryRunner({ reservation });
      mockDataSource.createQueryRunner.mockReturnValue(qr);

      const event = makeStripeEvent('payment_intent.payment_failed', 'pi_test');
      await service.handleEvent(event);

      expect(qr.commitTransaction).toHaveBeenCalled();
      expect(mockSseService.emitReservationStatus).toHaveBeenCalledWith(
        reservation.id,
        ReservationStatus.CANCELLED,
      );
    });
  });

  // ── payment_intent.canceled ────────────────────────────────────────────────

  describe('payment_intent.canceled', () => {
    it('should cancel AWAITING_CAPTURE reservation on PI cancel', async () => {
      const reservation = makeReservation(ReservationStatus.AWAITING_CAPTURE);
      const qr = makeQueryRunner({ reservation });
      mockDataSource.createQueryRunner.mockReturnValue(qr);

      const event = makeStripeEvent('payment_intent.canceled', 'pi_test');
      await service.handleEvent(event);

      expect(qr.commitTransaction).toHaveBeenCalled();
      expect(mockSseService.emitReservationStatus).toHaveBeenCalledWith(
        reservation.id,
        ReservationStatus.CANCELLED,
      );
    });

    it('should be a no-op if reservation is already CANCELLED (idempotent)', async () => {
      const reservation = makeReservation(ReservationStatus.CANCELLED);
      const qr = makeQueryRunner({ reservation });
      mockDataSource.createQueryRunner.mockReturnValue(qr);

      const event = makeStripeEvent('payment_intent.canceled', 'pi_test');
      await service.handleEvent(event);

      expect(mockSseService.emitReservationStatus).not.toHaveBeenCalled();
      expect(qr.commitTransaction).toHaveBeenCalled();
    });
  });
});
