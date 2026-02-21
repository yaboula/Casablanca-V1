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

  @IsEnum(VehicleCategory)
  category: VehicleCategory;

  @IsInt()
  @IsPositive()
  pricePerDayEurCents: number;

  @IsString()
  @IsUrl()
  imageUrl: string;

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
