import {
  IsEnum,
  IsOptional,
  IsBoolean,
  IsString,
  IsInt,
  IsPositive,
  IsArray,
  Min,
  MinLength,
  MaxLength,
  Matches,
  IsUrl,
} from 'class-validator';
import { UserRole } from '../../users/user.entity';
import { VehicleCategory, VehicleStatus, Transmission } from '../../vehicles/vehicle.entity';

// ── Users ───────────────────────────────────────────────────────────────────

export class UpdateUserDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ── Vehicles ────────────────────────────────────────────────────────────────

export class CreateVehicleDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  brand: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  model: string;

  @IsString()
  @Matches(/^[A-Za-z0-9 -]{3,20}$/, {
    message:
      'licensePlate must be 3-20 chars using letters, numbers, spaces or hyphens',
  })
  licensePlate: string;

  @IsEnum(VehicleCategory)
  category: VehicleCategory;

  @IsInt()
  @IsPositive()
  pricePerDayEurCents: number;

  @IsString()
  @IsUrl()
  imageUrl: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  imageUrls?: string[];

  @IsEnum(Transmission)
  transmission: Transmission;

  @IsInt()
  @Min(1)
  seats: number;

  @IsInt()
  @Min(0)
  luggageCount: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;
}

export class UpdateVehicleDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  brand?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  model?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9 -]{3,20}$/, {
    message:
      'licensePlate must be 3-20 chars using letters, numbers, spaces or hyphens',
  })
  licensePlate?: string;

  @IsOptional()
  @IsEnum(VehicleCategory)
  category?: VehicleCategory;

  @IsOptional()
  @IsInt()
  @IsPositive()
  pricePerDayEurCents?: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  imageUrls?: string[];

  @IsOptional()
  @IsEnum(Transmission)
  transmission?: Transmission;

  @IsOptional()
  @IsInt()
  @Min(1)
  seats?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  luggageCount?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;
}
