import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { VehiclesService, FindAvailableQuery } from './vehicles.service';
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
});
