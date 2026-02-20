import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { VehicleCategory } from './vehicle.entity';

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  /**
   * GET /api/v1/vehicles
   * Public endpoint — no auth required.
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
    // Validate category enum if provided
    let vehicleCategory: VehicleCategory | undefined;
    if (category) {
      if (!Object.values(VehicleCategory).includes(category as VehicleCategory)) {
        throw new BadRequestException(`Categoría inválida: ${category}`);
      }
      vehicleCategory = category as VehicleCategory;
    }

    if (pickupDateStr && returnDateStr) {
      const pickupDate = new Date(pickupDateStr);
      const returnDate = new Date(returnDateStr);

      if (isNaN(pickupDate.getTime()) || isNaN(returnDate.getTime())) {
        throw new BadRequestException('Las fechas deben estar en formato ISO 8601.');
      }

      if (returnDate <= pickupDate) {
        throw new BadRequestException('returnDate debe ser posterior a pickupDate.');
      }

      const minRental = new Date(pickupDate);
      minRental.setDate(minRental.getDate() + 1);
      if (returnDate < minRental) {
        throw new BadRequestException('El alquiler mínimo es 1 día.');
      }

      const vehicles = await this.vehiclesService.findAvailable({
        pickupDate,
        returnDate,
        category: vehicleCategory,
      });

      return { data: vehicles, total: vehicles.length };
    }

    // No dates — return all available (catalog view)
    const vehicles = await this.vehiclesService.findAll();
    return { data: vehicles, total: vehicles.length };
  }

  /**
   * GET /api/v1/vehicles/:id
   * Public — returns vehicle detail regardless of availability.
   */
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const vehicle = await this.vehiclesService.findOne(id);
    return { data: vehicle };
  }
}
