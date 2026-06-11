import {
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { PickupLocation } from '../reservation.entity';

/**
 * DTO for creating a new reservation.
 *
 * SECURITY NOTE: pricing fields are intentionally NOT accepted from the client.
 * Price, duration, deposit, and payment amount are always recalculated
 * server-side using the active backend pricing policy.
 */
export class CreateReservationDto {
  @IsUUID('4', { message: 'vehicleId must be a valid UUID v4.' })
  vehicleId: string;

  @ValidateIf((dto: CreateReservationDto) => !dto.pickupDate)
  @IsISO8601({}, { message: 'pickupAt must be ISO 8601.' })
  pickupAt?: string;

  @ValidateIf((dto: CreateReservationDto) => !dto.returnDate)
  @IsISO8601({}, { message: 'returnAt must be ISO 8601.' })
  returnAt?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'pickupDate must be ISO 8601.' })
  pickupDate?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'returnDate must be ISO 8601.' })
  returnDate?: string;

  @IsEnum(PickupLocation, {
    message: `pickupLocation must be one of: ${Object.values(PickupLocation).join(', ')}`,
  })
  pickupLocation: PickupLocation;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  customerName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9\s\-().]{7,30}$/, {
    message: 'Invalid phone number.',
  })
  customerPhone?: string;
}
