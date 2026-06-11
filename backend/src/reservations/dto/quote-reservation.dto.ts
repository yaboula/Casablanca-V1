import { IsEnum, IsISO8601, IsUUID } from 'class-validator';
import { PickupLocation } from '../reservation.entity';

export class QuoteReservationDto {
  @IsUUID('4', { message: 'vehicleId must be a valid UUID v4.' })
  vehicleId: string;

  @IsISO8601({}, { message: 'pickupAt must be ISO 8601.' })
  pickupAt: string;

  @IsISO8601({}, { message: 'returnAt must be ISO 8601.' })
  returnAt: string;

  @IsEnum(PickupLocation, {
    message: `pickupLocation must be one of: ${Object.values(PickupLocation).join(', ')}`,
  })
  pickupLocation: PickupLocation;
}
