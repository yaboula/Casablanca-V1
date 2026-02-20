import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bullmq';
import { DataSource } from 'typeorm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { Reservation, ReservationStatus } from './reservation.entity';
import { Vehicle, VehicleStatus } from '../vehicles/vehicle.entity';
import { User, UserRole } from '../users/user.entity';
import { StripeService } from '../stripe/stripe.service';
import { QrService } from '../qr/qr.service';
import { PickupLocation } from './reservation.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';

// ─── Factory helpers ──────────────────────────────────────────────────────────

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-123',
    email: 'customer@test.com',
    role: UserRole.USER,
    firstName: 'Test',
    lastName: 'User',
    ...overrides,
  } as User;
}

function makeVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: 'vehicle-abc',
    status: VehicleStatus.AVAILABLE,
    pricePerDayEurCents: 5000, // 50 €/day
    ...overrides,
  } as Vehicle;
}

function makeReservation(overrides: Partial<Reservation> = {}): Reservation {
  return {
    id: 'res-999',
    userId: 'user-123',
    vehicleId: 'vehicle-abc',
    status: ReservationStatus.PENDING_DEPOSIT,
    totalDays: 3,
    totalPriceEurCents: 15000,
    depositEurCents: 1000,
    stripePaymentIntentId: 'pi_test',
    stripeClientSecret: 'pi_test_secret_xxx',
    qrCodeHash: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Reservation;
}

// ─── Mocks ────────────────────────────────────────────────────────────────────

/** Creates a minimal QueryRunner mock that simulates a successful transaction */
const makeQueryRunner = (vehicleRow: Vehicle | null, conflictCount: number = 0) => ({
  connect: jest.fn().mockResolvedValue(undefined),
  startTransaction: jest.fn().mockResolvedValue(undefined),
  commitTransaction: jest.fn().mockResolvedValue(undefined),
  rollbackTransaction: jest.fn().mockResolvedValue(undefined),
  release: jest.fn().mockResolvedValue(undefined),
  manager: {
    getRepository: jest.fn().mockImplementation((entity: any) => {
      if (entity === Vehicle) {
        return {
          findOne: jest.fn().mockResolvedValue(vehicleRow),
        };
      }
      if (entity === Reservation) {
        return {
          createQueryBuilder: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getCount: jest.fn().mockResolvedValue(conflictCount),
          }),
          create: jest.fn().mockImplementation((dto: any) => dto),
          save: jest.fn().mockImplementation((r: any) => Promise.resolve({ ...r, id: 'res-999' })),
        };
      }
      return {};
    }),
  },
});

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('ReservationsService', () => {
  let service: ReservationsService;

  const mockReservationsRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockVehiclesRepo = {
    findOne: jest.fn(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(),
  };

  const mockStripeService = {
    createPaymentIntent: jest.fn().mockResolvedValue({
      id: 'pi_test',
      client_secret: 'pi_test_secret_xxx',
    }),
    cancelPaymentIntent: jest.fn().mockResolvedValue({}),
  };

  const mockQrService = {
    generateHash: jest.fn().mockReturnValue('mock-qr-hash'),
  };

  const mockExpiryQueue = {
    add: jest.fn().mockResolvedValue({ id: 'job-1' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        {
          provide: getRepositoryToken(Reservation),
          useValue: mockReservationsRepo,
        },
        {
          provide: getRepositoryToken(Vehicle),
          useValue: mockVehiclesRepo,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: StripeService,
          useValue: mockStripeService,
        },
        {
          provide: QrService,
          useValue: mockQrService,
        },
        {
          provide: getQueueToken('reservation-expiry'),
          useValue: mockExpiryQueue,
        },
      ],
    }).compile();

    service = module.get<ReservationsService>(ReservationsService);
  });

  // ── create() ───────────────────────────────────────────────────────────────

  describe('create()', () => {
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString();
    const threeDaysLater = new Date(Date.now() + 3 * 86_400_000).toISOString();

    const dto: CreateReservationDto = {
      vehicleId: 'vehicle-abc',
      pickupDate: tomorrow,
      returnDate: threeDaysLater,
      pickupLocation: PickupLocation.CMN_T1,
      customerName: 'Test User',
      customerPhone: '+34600000000',
    };

    it('should create a reservation and enqueue expiry job on success', async () => {
      const vehicle = makeVehicle();
      const qr = makeQueryRunner(vehicle, 0); // 0 conflicting reservations
      mockDataSource.createQueryRunner.mockReturnValue(qr);

      const user = makeUser();
      const result = await service.create(dto, user);

      expect(qr.startTransaction).toHaveBeenCalled();
      expect(qr.commitTransaction).toHaveBeenCalled();
      expect(qr.rollbackTransaction).not.toHaveBeenCalled();

      expect(mockStripeService.createPaymentIntent).toHaveBeenCalledWith(
        1000, // DEPOSIT_EUR_CENTS
        expect.any(String),
        expect.any(Object),
      );

      expect(mockExpiryQueue.add).toHaveBeenCalledWith(
        'expire',
        { reservationId: expect.any(String) },
        expect.objectContaining({ delay: 15 * 60 * 1000 }),
      );

      expect(result.id).toBe('res-999');
    });

    it('should throw BadRequestException if pickupDate is in the past', async () => {
      const yesterday = new Date(Date.now() - 86_400_000).toISOString();
      const badDto = { ...dto, pickupDate: yesterday };
      const user = makeUser();

      await expect(service.create(badDto, user)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if returnDate <= pickupDate', async () => {
      const badDto = { ...dto, returnDate: tomorrow }; // same day
      const user = makeUser();

      await expect(service.create(badDto, user)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if vehicle does not exist', async () => {
      const qr = makeQueryRunner(null); // vehicle not found
      mockDataSource.createQueryRunner.mockReturnValue(qr);
      const user = makeUser();

      await expect(service.create(dto, user)).rejects.toThrow(NotFoundException);
      expect(qr.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw ConflictException if vehicle is unavailable for the dates', async () => {
      const vehicle = makeVehicle();
      const qr = makeQueryRunner(vehicle, 1); // 1 conflicting reservation
      mockDataSource.createQueryRunner.mockReturnValue(qr);
      const user = makeUser();

      await expect(service.create(dto, user)).rejects.toThrow(ConflictException);
      expect(qr.rollbackTransaction).toHaveBeenCalled();
    });

    it('should calculate price server-side (Zero Trust)', async () => {
      const vehicle = makeVehicle({ pricePerDayEurCents: 10000 }); // 100 €/day
      const qr = makeQueryRunner(vehicle, 0);
      mockDataSource.createQueryRunner.mockReturnValue(qr);

      // Verify the reservation repo .create() is called with server-computed price
      let capturedReservationData: any;
      qr.manager.getRepository.mockImplementation((entity: any) => {
        if (entity === Vehicle) return { findOne: jest.fn().mockResolvedValue(vehicle) };
        if (entity === Reservation) {
          return {
            createQueryBuilder: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getCount: jest.fn().mockResolvedValue(0),
            }),
            create: jest.fn().mockImplementation((data: any) => {
              capturedReservationData = data;
              return data;
            }),
            save: jest.fn().mockImplementation((r: any) => Promise.resolve({ ...r, id: 'res-999' })),
          };
        }
        return {};
      });

      const user = makeUser();
      await service.create(dto, user);

      // 2 full days × 100 €/day = 200 € = 20000 cents (dates: tomorrow to threeDaysLater ≈ 2 days)
      expect(capturedReservationData.totalPriceEurCents).toBeGreaterThan(0);
      // Deposit is always fixed at 1000 cents = 10 €
      expect(capturedReservationData.depositEurCents).toBe(1000);
    });
  });

  // ── cancel() ───────────────────────────────────────────────────────────────

  describe('cancel()', () => {
    it('should cancel a PENDING_DEPOSIT reservation as the owner', async () => {
      const reservation = makeReservation();
      mockReservationsRepo.findOne.mockResolvedValue(reservation);
      mockReservationsRepo.save.mockResolvedValue({
        ...reservation,
        status: ReservationStatus.CANCELLED,
      });

      const user = makeUser();
      const result = await service.cancel('res-999', user);

      expect(result.status).toBe(ReservationStatus.CANCELLED);
      // Stripe cancel is called fire-and-forget — just verify it was called
      expect(mockStripeService.cancelPaymentIntent).toHaveBeenCalledWith('pi_test');
    });

    it('should throw ForbiddenException if USER tries to cancel another user\'s reservation', async () => {
      const reservation = makeReservation({ userId: 'other-user' });
      mockReservationsRepo.findOne.mockResolvedValue(reservation);

      const user = makeUser({ id: 'user-123' });
      await expect(service.cancel('res-999', user)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException if status is not cancelable', async () => {
      const reservation = makeReservation({ status: ReservationStatus.IN_PROGRESS });
      mockReservationsRepo.findOne.mockResolvedValue(reservation);

      const user = makeUser();
      await expect(service.cancel('res-999', user)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException for non-existent reservation', async () => {
      mockReservationsRepo.findOne.mockResolvedValue(null);

      const user = makeUser();
      await expect(service.cancel('no-such-id', user)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── complete() ─────────────────────────────────────────────────────────────

  describe('complete()', () => {
    it('should set IN_PROGRESS reservation to COMPLETED', async () => {
      const reservation = makeReservation({ status: ReservationStatus.IN_PROGRESS });
      mockReservationsRepo.findOne.mockResolvedValue(reservation);
      mockReservationsRepo.save.mockResolvedValue({
        ...reservation,
        status: ReservationStatus.COMPLETED,
      });

      const result = await service.complete('res-999');
      expect(result.status).toBe(ReservationStatus.COMPLETED);
    });

    it('should throw BadRequestException if reservation is not IN_PROGRESS', async () => {
      const reservation = makeReservation({ status: ReservationStatus.CONFIRMED });
      mockReservationsRepo.findOne.mockResolvedValue(reservation);

      await expect(service.complete('res-999')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException for non-existent reservation', async () => {
      mockReservationsRepo.findOne.mockResolvedValue(null);

      await expect(service.complete('no-such-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── findMy() ────────────────────────────────────────────────────────────────

  describe('findMy()', () => {
    it('should return only the user\'s own reservations for USER role', async () => {
      const reservations = [makeReservation()];
      mockReservationsRepo.find.mockResolvedValue(reservations);

      const user = makeUser();
      const result = await service.findMy(user);

      expect(mockReservationsRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-123' } }),
      );
      expect(result).toEqual(reservations);
    });

    it('should return ALL reservations for OPERATOR role', async () => {
      const reservations = [makeReservation(), makeReservation({ id: 'res-888' })];
      mockReservationsRepo.find.mockResolvedValue(reservations);

      const operator = makeUser({ role: UserRole.OPERATOR });
      const result = await service.findMy(operator);

      // No userId filter for operators
      expect(mockReservationsRepo.find).toHaveBeenCalledWith(
        expect.not.objectContaining({ where: { userId: expect.anything() } }),
      );
      expect(result.length).toBe(2);
    });
  });
});
