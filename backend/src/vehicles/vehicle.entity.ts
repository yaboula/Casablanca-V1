import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum VehicleCategory {
  SEDAN = 'SEDAN',
  SUV = 'SUV',
  LUXURY = 'LUXURY',
  COMPACT = 'COMPACT',
}

export enum VehicleStatus {
  AVAILABLE = 'AVAILABLE',
  RENTED = 'RENTED',
  MAINTENANCE = 'MAINTENANCE',
  INACTIVE = 'INACTIVE',
}

export enum Transmission {
  AUTOMATIC = 'AUTOMATIC',
  MANUAL = 'MANUAL',
}

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 80 })
  brand: string;

  @Column({ length: 120 })
  model: string;

  @Index()
  @Column({ type: 'enum', enum: VehicleCategory })
  category: VehicleCategory;

  /**
   * Daily rental price in EUR cents (integer) to avoid floating-point issues.
   * e.g. 160 EUR = 16000
   */
  @Column({ name: 'price_per_day_eur_cents', type: 'integer' })
  pricePerDayEurCents: number;

  @Column({ name: 'image_url', length: 500 })
  imageUrl: string;

  /** Additional gallery images (PostgreSQL text array) */
  @Column({ name: 'image_urls', type: 'text', array: true, default: '{}' })
  imageUrls: string[];

  @Column({ type: 'enum', enum: Transmission })
  transmission: Transmission;

  @Column({ type: 'smallint' })
  seats: number;

  @Column({ name: 'luggage_count', type: 'smallint' })
  luggageCount: number;

  /** Feature tags (e.g. ['SIM 5GB', 'Tag Jawaz', 'GPS integrado']) */
  @Column({ type: 'text', array: true, default: '{}' })
  features: string[];

  @Index()
  @Column({ type: 'enum', enum: VehicleStatus, default: VehicleStatus.AVAILABLE })
  status: VehicleStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
