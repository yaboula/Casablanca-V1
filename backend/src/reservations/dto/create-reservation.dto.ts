import {
  IsUUID,
  IsISO8601,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  Matches,
} from 'class-validator';
import { PickupLocation } from '../reservation.entity';

/**
 * DTO for creating a new reservation.
 *
 * SECURITY NOTE: totalPriceEUR is intentionally NOT accepted from the client.
 * Price is always recalculated server-side using vehicle.pricePerDayEurCents × totalDays.
 * This prevents price tampering attacks.
 */
export class CreateReservationDto {
  @IsUUID('4', { message: 'vehicleId debe ser un UUID v4 válido.' })
  vehicleId: string;

  @IsISO8601({}, { message: 'pickupDate debe estar en formato ISO 8601.' })
  pickupDate: string;

  @IsISO8601({}, { message: 'returnDate debe estar en formato ISO 8601.' })
  returnDate: string;

  @IsEnum(PickupLocation, {
    message: `pickupLocation debe ser uno de: ${Object.values(PickupLocation).join(', ')}`,
  })
  pickupLocation: PickupLocation;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  customerName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9\s\-().]{7,30}$/, { message: 'Número de teléfono inválido.' })
  customerPhone?: string;
}
