import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { VehiclesService, FindAvailableQuery } from './vehicles.service';
import {
  DepositRefundStatus,
  DepositStatus,
  PickupLocation,
  Reservation,
  ReservationStatus,
} from '../reservations/reservation.entity';
import { Vehicle, VehicleCategory, VehicleStatus } from './vehicle.entity';

// ─── Factory ──────────────────────────────────────────────────────────────────

function makeVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: 'vehicle-abc',
    brand: 'Toyota',
    model: 'Corolla',
    category: VehicleCategory.SEDAN,
    status: VehicleStatus.AVAILABLE,
    pricePerDayEurCents: 5000,
    imageUrl: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  } as Vehicle;
}

// ─── Mock QueryBuilder chain ──────────────────────────────────────────────────

const mockQbChain = {
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  getMany: jest.fn(),
};

const mockVehiclesRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue(mockQbChain),
};

const mockReservationQbChain = {
  select: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  getMany: jest.fn(),
};

const mockReservationsRepo = {
  createQueryBuilder: jest.fn().mockReturnValue(mockReservationQbChain),
};

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('VehiclesService', () => {
  let service: VehiclesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockVehiclesRepo.createQueryBuilder.mockReturnValue(mockQbChain);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        { provide: getRepositoryToken(Vehicle), useValue: mockVehiclesRepo },
        {
          provide: getRepositoryToken(Reservation),
          useValue: mockReservationsRepo,
        },
      ],
    }).compile();

    service = module.get(VehiclesService);
  });

  // ── findAvailable() ────────────────────────────────────────────────────────

  describe('findAvailable()', () => {
    const query: FindAvailableQuery = {
      pickupDate: new Date('2025-07-01'),
      returnDate: new Date('2025-07-05'),
    };

    it('ejecuta QueryBuilder con filtro de status y subquery de fechas', async () => {
      const vehicles = [makeVehicle()];
      mockQbChain.getMany.mockResolvedValue(vehicles);

      const result = await service.findAvailable(query);

      expect(mockVehiclesRepo.createQueryBuilder).toHaveBeenCalledWith('vehicle');
      expect(mockQbChain.where).toHaveBeenCalledWith(
        'vehicle.status = :status',
        { status: VehicleStatus.AVAILABLE },
      );
      expect(mockQbChain.andWhere).toHaveBeenCalled(); // subquery de fechas
      expect(mockQbChain.andWhere.mock.calls[0][0]).toContain('created_at');
      expect(mockQbChain.andWhere.mock.calls[0][0]).toContain('INTERVAL');
      expect(result).toEqual(vehicles);
    });

    it('agrega filtro de categoría si se pasa category en el query', async () => {
      mockQbChain.getMany.mockResolvedValue([makeVehicle({ category: VehicleCategory.LUXURY })]);

      await service.findAvailable({ ...query, category: VehicleCategory.LUXURY });

      // andWhere llamado al menos 2 veces: subquery de fechas + filtro de categoría
      expect(mockQbChain.andWhere).toHaveBeenCalledWith(
        'vehicle.category = :category',
        { category: VehicleCategory.LUXURY },
      );
    });

    it('NO agrega filtro de categoría si category no se pasa', async () => {
      mockQbChain.getMany.mockResolvedValue([makeVehicle()]);

      await service.findAvailable(query); // sin category

      const categoryCallArgs = mockQbChain.andWhere.mock.calls.map((c: any[]) => c[0]);
      const hasCategoryFilter = categoryCallArgs.some((arg: string) =>
        arg.includes('category'),
      );
      expect(hasCategoryFilter).toBe(false);
    });
  });

  // ── findOne() ──────────────────────────────────────────────────────────────

  describe('findOne()', () => {
    it('devuelve el vehículo si existe', async () => {
      const vehicle = makeVehicle();
      mockVehiclesRepo.findOne.mockResolvedValue(vehicle);

      const result = await service.findOne('vehicle-abc');

      expect(result.id).toBe('vehicle-abc');
    });

    it('lanza NotFoundException si el vehículo no existe', async () => {
      mockVehiclesRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('no-existe')).rejects.toThrow(NotFoundException);
    });
  });

  // ── findAll() ──────────────────────────────────────────────────────────────

  describe('findAll()', () => {
    it('filtra por status AVAILABLE y ordena por precio ASC', async () => {
      const vehicles = [makeVehicle({ pricePerDayEurCents: 3000 }), makeVehicle({ pricePerDayEurCents: 5000 })];
      mockVehiclesRepo.find.mockResolvedValue(vehicles);

      const result = await service.findAll();

      expect(mockVehiclesRepo.find).toHaveBeenCalledWith({
        where: { status: VehicleStatus.AVAILABLE },
        order: { pricePerDayEurCents: 'ASC' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('getAvailabilityCalendar()', () => {
    it('returns sanitized calendar days and blocked intervals with buffer', async () => {
      mockVehiclesRepo.findOne.mockResolvedValue(makeVehicle());
      mockReservationQbChain.getMany.mockResolvedValue([
        makeReservation({
          pickupDate: new Date('2027-07-10T10:00:00.000Z'),
          returnDate: new Date('2027-07-10T14:00:00.000Z'),
          status: ReservationStatus.CONFIRMED,
        }),
      ]);

      const result = await service.getAvailabilityCalendar({
        vehicleId: 'vehicle-abc',
        from: new Date('2027-07-10T00:00:00.000Z'),
        to: new Date('2027-07-10T00:00:00.000Z'),
      });

      expect(result.vehicleId).toBe('vehicle-abc');
      expect(result.operationalBufferHours).toBe(4);
      expect(result.pendingDepositHoldMinutes).toBe(15);
      expect(result.days).toEqual([
        {
          date: '2027-07-10',
          status: 'PARTIAL',
          pricePerDayEurCents: 5000,
        },
      ]);
      expect(result.blockedIntervals).toEqual([
        {
          startAt: '2027-07-10T10:00:00.000Z',
          endAt: '2027-07-10T14:00:00.000Z',
          bufferedEndAt: '2027-07-10T18:00:00.000Z',
          status: ReservationStatus.CONFIRMED,
        },
      ]);
      expect(JSON.stringify(result)).not.toContain('customer');
      expect(JSON.stringify(result)).not.toContain('stripe');
    });

    it('marks fully blocked service days as unavailable', async () => {
      mockVehiclesRepo.findOne.mockResolvedValue(makeVehicle());
      mockReservationQbChain.getMany.mockResolvedValue([
        makeReservation({
          pickupDate: new Date('2027-07-10T00:00:00.000Z'),
          returnDate: new Date('2027-07-10T20:00:00.000Z'),
          status: ReservationStatus.IN_PROGRESS,
        }),
      ]);

      const result = await service.getAvailabilityCalendar({
        vehicleId: 'vehicle-abc',
        from: new Date('2027-07-10T00:00:00.000Z'),
        to: new Date('2027-07-10T00:00:00.000Z'),
      });

      expect(result.days[0].status).toBe('UNAVAILABLE');
    });
  });
});

function makeReservation(overrides: Partial<Reservation> = {}): Reservation {
  return {
    id: 'reservation-abc',
    userId: 'user-abc',
    vehicleId: 'vehicle-abc',
    pickupDate: new Date('2027-07-10T10:00:00.000Z'),
    returnDate: new Date('2027-07-10T14:00:00.000Z'),
    totalDays: 1,
    totalPriceEurCents: 5000,
    depositEurCents: 1000,
    dailyRateEurCentsSnapshot: 5000,
    subtotalEurCents: 5000,
    totalDueNowEurCents: 1000,
    chargedDayUnitsX2: 2,
    fullDays: 1,
    extraHours: 0,
    extraBillingType: 'NONE' as any,
    pricingPolicyVersion: 'test',
    currency: 'EUR',
    pickupLocation: PickupLocation.CMN_T1,
    status: ReservationStatus.CONFIRMED,
    stripePaymentIntentId: null,
    stripeClientSecret: null,
    depositStatus: DepositStatus.CAPTURED,
    depositCapturedAt: null,
    depositLastFailureAt: null,
    depositLastFailureReason: null,
    depositRefundStatus: DepositRefundStatus.NOT_APPLICABLE,
    depositRefundAttemptedAt: null,
    depositRefundFailureAt: null,
    depositRefundFailureReason: null,
    deskCollectionStatus: 'PENDING' as any,
    deskCollectionMethod: null,
    deskCollectionReference: null,
    deskCollectionReceivedAt: null,
    deskCollectionAmountEurCents: null,
    qrCodeHash: null,
    ticketTokenVersion: 0,
    ticketRevokedAt: null,
    customerName: null,
    customerPhone: null,
    idempotencyKey: null,
    createdAt: new Date('2027-07-01T00:00:00.000Z'),
    updatedAt: new Date('2027-07-01T00:00:00.000Z'),
    ...overrides,
  } as Reservation;
}
