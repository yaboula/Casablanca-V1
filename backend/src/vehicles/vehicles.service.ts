import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle, VehicleCategory, VehicleStatus } from './vehicle.entity';

export interface FindAvailableQuery {
  pickupDate: Date;
  returnDate: Date;
  category?: VehicleCategory;
}

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehiclesRepo: Repository<Vehicle>,
  ) {}

  /**
   * Returns vehicles that:
   * 1. Are AVAILABLE in status (not RENTED/MAINTENANCE/INACTIVE)
   * 2. Have no confirmed/in-progress reservation overlapping [pickupDate, returnDate)
   *
   * MVP scale: NOT IN subquery is acceptable (<3,000 reservations at launch).
   * Migrate to tsrange + GiST when fleet > 500.
   */
  async findAvailable(query: FindAvailableQuery): Promise<Vehicle[]> {
    const { pickupDate, returnDate, category } = query;

    const qb = this.vehiclesRepo
      .createQueryBuilder('vehicle')
      .where('vehicle.status = :status', { status: VehicleStatus.AVAILABLE })
      .andWhere(
        `vehicle.id NOT IN (
          SELECT r."vehicle_id"
          FROM reservations r
          WHERE r.status IN ('PENDING_DEPOSIT', 'AWAITING_CAPTURE', 'CONFIRMED', 'IN_PROGRESS')
            AND r."pickup_date" < :returnDate
            AND r."return_date" > :pickupDate
        )`,
        { pickupDate, returnDate },
      )
      .orderBy('vehicle.price_per_day_eur_cents', 'ASC');

    if (category) {
      qb.andWhere('vehicle.category = :category', { category });
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<Vehicle> {
    const vehicle = await this.vehiclesRepo.findOne({ where: { id } });

    if (!vehicle) {
      throw new NotFoundException(`Vehículo ${id} no encontrado.`);
    }

    return vehicle;
  }

  async findAll(): Promise<Vehicle[]> {
    return this.vehiclesRepo.find({
      where: { status: VehicleStatus.AVAILABLE },
      order: { pricePerDayEurCents: 'ASC' },
    });
  }
}
