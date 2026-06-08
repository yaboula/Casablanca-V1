import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  Reservation,
  ReservationStatus,
} from "../../reservations/reservation.entity";
import { Vehicle, VehicleStatus } from "../../vehicles/vehicle.entity";
import { CreateVehicleDto, UpdateVehicleDto } from "../dto/admin.dto";

/**
 * Admin CRUD for the vehicle fleet.
 * Business rules enforced:
 *  - Cannot soft-delete a vehicle with active reservations.
 *  - Cannot hard-delete a vehicle with any reservation history.
 *  - listAllVehicles supports pagination (default 20, max 100).
 */
@Injectable()
export class AdminVehiclesService {
  private readonly logger = new Logger(AdminVehiclesService.name);

  constructor(
    @InjectRepository(Vehicle)
    private readonly vehiclesRepo: Repository<Vehicle>,
    @InjectRepository(Reservation)
    private readonly reservationsRepo: Repository<Reservation>,
  ) {}

  private normalizeLicensePlate(value: string): string {
    return value.trim().toUpperCase().replace(/\s+/g, " ");
  }

  async listAllVehicles(
    page = 1,
    limit = 20,
  ): Promise<{ data: Vehicle[]; total: number; page: number; limit: number }> {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safePage = Math.max(page, 1);

    const [data, total] = await this.vehiclesRepo.findAndCount({
      order: { createdAt: "DESC" },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    });

    this.logger.log(`listAllVehicles(page=${safePage}) -> ${total} total`);
    return { data, total, page: safePage, limit: safeLimit };
  }

  async createVehicle(dto: CreateVehicleDto): Promise<Vehicle> {
    const licensePlate = this.normalizeLicensePlate(dto.licensePlate);
    const existingVehicle = await this.vehiclesRepo.findOne({
      where: { licensePlate },
    });

    if (existingVehicle) {
      throw new ConflictException(
        `Vehicle with license plate ${licensePlate} already exists.`,
      );
    }

    const vehicle = this.vehiclesRepo.create({
      brand: dto.brand,
      model: dto.model,
      licensePlate,
      category: dto.category,
      pricePerDayEurCents: dto.pricePerDayEurCents,
      imageUrl: dto.imageUrl,
      imageUrls: dto.imageUrls ?? [dto.imageUrl],
      transmission: dto.transmission,
      seats: dto.seats,
      luggageCount: dto.luggageCount,
      features: dto.features ?? [],
      status: dto.status ?? VehicleStatus.AVAILABLE,
    });

    const saved = await this.vehiclesRepo.save(vehicle);
    this.logger.log(
      `createVehicle: ${saved.brand} ${saved.model} (${saved.id})`,
    );
    return saved;
  }

  async updateVehicle(id: string, dto: UpdateVehicleDto): Promise<Vehicle> {
    const vehicle = await this.vehiclesRepo.findOne({ where: { id } });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle ${id} not found.`);
    }

    if (dto.licensePlate !== undefined) {
      dto.licensePlate = this.normalizeLicensePlate(dto.licensePlate);
      const existingVehicle = await this.vehiclesRepo.findOne({
        where: { licensePlate: dto.licensePlate },
      });

      if (existingVehicle && existingVehicle.id !== id) {
        throw new ConflictException(
          `Vehicle with license plate ${dto.licensePlate} already exists.`,
        );
      }
    }

    Object.assign(vehicle, dto);
    const saved = await this.vehiclesRepo.save(vehicle);
    this.logger.log(`updateVehicle: ${id}`);
    return saved;
  }

  async deleteVehicle(id: string): Promise<void> {
    const vehicle = await this.vehiclesRepo.findOne({ where: { id } });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle ${id} not found.`);
    }

    const activeReservations = await this.reservationsRepo.count({
      where: [
        { vehicleId: id, status: ReservationStatus.CONFIRMED },
        { vehicleId: id, status: ReservationStatus.IN_PROGRESS },
        { vehicleId: id, status: ReservationStatus.PENDING_DEPOSIT },
        { vehicleId: id, status: ReservationStatus.AWAITING_CAPTURE },
      ],
    });

    if (activeReservations > 0) {
      throw new BadRequestException(
        "Cannot deactivate a vehicle with active reservations.",
      );
    }

    vehicle.status = VehicleStatus.INACTIVE;
    await this.vehiclesRepo.save(vehicle);
    this.logger.log(`deleteVehicle (soft): ${id} -> INACTIVE`);
  }

  async hardDeleteVehicle(id: string): Promise<void> {
    const vehicle = await this.vehiclesRepo.findOne({ where: { id } });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle ${id} not found.`);
    }

    const anyReservation = await this.reservationsRepo.count({
      where: { vehicleId: id },
    });

    if (anyReservation > 0) {
      throw new BadRequestException(
        "Cannot permanently delete a vehicle with reservation history.",
      );
    }

    await this.vehiclesRepo.remove(vehicle);
    this.logger.log(`hardDeleteVehicle: ${id} removed`);
  }
}
