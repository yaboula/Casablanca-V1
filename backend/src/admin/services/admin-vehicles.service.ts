import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Vehicle, VehicleStatus } from "../../vehicles/vehicle.entity";
import {
  Reservation,
  ReservationStatus,
} from "../../reservations/reservation.entity";
import { CreateVehicleDto, UpdateVehicleDto } from "../dto/admin.dto";

/**
 * Admin CRUD for the vehicle fleet.
 * Business rules enforced:
 *  - Cannot soft-delete a vehicle with active reservations.
 *  - Cannot hard-delete a vehicle with ANY reservation history.
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

    this.logger.log(`listAllVehicles(page=${safePage}) → ${total} total`);
    return { data, total, page: safePage, limit: safeLimit };
  }

  async createVehicle(dto: CreateVehicleDto): Promise<Vehicle> {
    const vehicle = this.vehiclesRepo.create({
      brand: dto.brand,
      model: dto.model,
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
    if (!vehicle) throw new NotFoundException(`Vehículo ${id} no encontrado.`);

    Object.assign(vehicle, dto);
    const saved = await this.vehiclesRepo.save(vehicle);
    this.logger.log(`updateVehicle: ${id}`);
    return saved;
  }

  /** Soft delete — sets status INACTIVE. Blocked if active reservations exist. */
  async deleteVehicle(id: string): Promise<void> {
    const vehicle = await this.vehiclesRepo.findOne({ where: { id } });
    if (!vehicle) throw new NotFoundException(`Vehículo ${id} no encontrado.`);

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
        "No se puede desactivar un vehículo con reservas activas.",
      );
    }

    vehicle.status = VehicleStatus.INACTIVE;
    await this.vehiclesRepo.save(vehicle);
    this.logger.log(`deleteVehicle (soft): ${id} → INACTIVE`);
  }

  /** Hard delete — removes DB row. Blocked if ANY reservation history exists. */
  async hardDeleteVehicle(id: string): Promise<void> {
    const vehicle = await this.vehiclesRepo.findOne({ where: { id } });
    if (!vehicle) throw new NotFoundException(`Vehículo ${id} no encontrado.`);

    const anyReservation = await this.reservationsRepo.count({
      where: { vehicleId: id },
    });

    if (anyReservation > 0) {
      throw new BadRequestException(
        "No se puede eliminar permanentemente un vehículo con historial de reservas.",
      );
    }

    await this.vehiclesRepo.remove(vehicle);
    this.logger.log(`hardDeleteVehicle: ${id} removed`);
  }
}
