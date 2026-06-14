import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { Vehicle, VehicleCategory } from './vehicle.entity';

type PublicVehicle = Omit<Vehicle, 'licensePlate'>;

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  private toPublicVehicle(vehicle: Vehicle): PublicVehicle {
    const { licensePlate: _licensePlate, ...publicVehicle } = vehicle;
    return publicVehicle;
  }

  /**
   * GET /api/v1/vehicles
   * Public endpoint - no auth required.
   *
   * Query params:
   *   - pickupDate (ISO 8601, required for availability check)
   *   - returnDate (ISO 8601, required for availability check)
   *   - category   (optional: SEDAN | SUV | LUXURY | COMPACT)
   *
   * If dates not provided, returns all available vehicles without overlap check.
   */
  @Get()
  async findAll(
    @Query('pickupDate') pickupDateStr?: string,
    @Query('returnDate') returnDateStr?: string,
    @Query('category') category?: string,
  ) {
    let vehicleCategory: VehicleCategory | undefined;
    if (category) {
      if (!Object.values(VehicleCategory).includes(category as VehicleCategory)) {
        throw new BadRequestException(`Invalid category: ${category}`);
      }
      vehicleCategory = category as VehicleCategory;
    }

    if (pickupDateStr && returnDateStr) {
      const pickupDate = new Date(pickupDateStr);
      const returnDate = new Date(returnDateStr);

      if (isNaN(pickupDate.getTime()) || isNaN(returnDate.getTime())) {
        throw new BadRequestException('Dates must be valid ISO 8601 timestamps.');
      }

      if (returnDate <= pickupDate) {
        throw new BadRequestException('returnDate must be after pickupDate.');
      }

      const minRental = new Date(pickupDate);
      minRental.setDate(minRental.getDate() + 1);
      if (returnDate < minRental) {
        throw new BadRequestException('Minimum rental duration is 1 day.');
      }

      const vehicles = await this.vehiclesService.findAvailable({
        pickupDate,
        returnDate,
        category: vehicleCategory,
      });

      return {
        data: vehicles.map((vehicle) => this.toPublicVehicle(vehicle)),
        total: vehicles.length,
      };
    }

    const vehicles = await this.vehiclesService.findAll(vehicleCategory);
    return {
      data: vehicles.map((vehicle) => this.toPublicVehicle(vehicle)),
      total: vehicles.length,
    };
  }

  /**
   * GET /api/v1/vehicles/:id
   * Public - returns vehicle detail regardless of availability.
   */
  @Get(':id/availability-calendar')
  async getAvailabilityCalendar(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('from') fromStr?: string,
    @Query('to') toStr?: string,
  ) {
    if (!fromStr || !toStr) {
      throw new BadRequestException('from and to are required as YYYY-MM-DD.');
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(fromStr) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(toStr)
    ) {
      throw new BadRequestException('from and to must use YYYY-MM-DD.');
    }

    const from = new Date(`${fromStr}T00:00:00.000Z`);
    const to = new Date(`${toStr}T00:00:00.000Z`);

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      throw new BadRequestException('from and to must be valid dates.');
    }

    if (to < from) {
      throw new BadRequestException('to must be on or after from.');
    }

    const maxRangeDays = 370;
    if (to.getTime() - from.getTime() > maxRangeDays * 24 * 60 * 60 * 1000) {
      throw new BadRequestException('Availability range cannot exceed 370 days.');
    }

    const calendar = await this.vehiclesService.getAvailabilityCalendar({
      vehicleId: id,
      from,
      to,
    });

    return { data: calendar };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const vehicle = await this.vehiclesService.findOne(id);
    return { data: this.toPublicVehicle(vehicle) };
  }
}
