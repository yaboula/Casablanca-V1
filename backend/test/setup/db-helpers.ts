/**
 * Database helpers for integration tests
 * =====================================================================
 * truncateAllTables() — wipes ALL rows from ALL tables between tests,
 * guaranteeing full isolation without having to recreate the schema.
 *
 * Uses PostgreSQL's TRUNCATE ... CASCADE so that FK constraints don't
 * prevent truncation order issues.
 * =====================================================================
 */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';

export async function truncateAllTables(app: INestApplication): Promise<void> {
  const dataSource = app.get<DataSource>(getDataSourceToken());
  const entities = dataSource.entityMetadatas;

  if (entities.length === 0) return;

  // Build a single TRUNCATE statement for all tables — faster than one-by-one
  const tableNames = entities
    .map((e) => `"${e.tableName}"`)
    .join(', ');

  await dataSource.query(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE`);
}

/**
 * Seed a minimal vehicle row for tests that need a bookable vehicle.
 * Columns match Vehicle entity exactly.
 * Returns the inserted vehicle's UUID.
 */
export async function seedVehicle(
  app: INestApplication,
  overrides: Record<string, unknown> = {},
): Promise<string> {
  const dataSource = app.get<DataSource>(getDataSourceToken());

  const id = (overrides.id as string) ?? require('crypto').randomUUID();

  const brand               = (overrides.brand               ?? 'Toyota')     as string;
  const model               = (overrides.model               ?? 'Corolla')    as string;
  const licensePlate        = (overrides.license_plate       ?? `TS-${id.slice(0, 8).toUpperCase()}`) as string;
  const category            = (overrides.category            ?? 'SEDAN')      as string;
  const status              = (overrides.status              ?? 'AVAILABLE')  as string;
  const pricePerDayEurCents = (overrides.price_per_day_eur_cents ?? 5000)     as number;
  const imageUrl            = (overrides.image_url           ?? 'https://nexus.test/placeholder.jpg') as string;
  const imageUrls           = (overrides.image_urls          ?? '{}')         as string;
  const transmission        = (overrides.transmission        ?? 'AUTOMATIC')  as string;
  const seats               = (overrides.seats               ?? 5)            as number;
  const luggageCount        = (overrides.luggage_count       ?? 2)            as number;
  const features            = (overrides.features            ?? '{}')         as string;

  await dataSource.query(
    `INSERT INTO vehicles
       (id, brand, model, category, status, price_per_day_eur_cents,
        image_url, image_urls, transmission, seats, luggage_count, features, license_plate)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [id, brand, model, category, status, pricePerDayEurCents,
     imageUrl, imageUrls, transmission, seats, luggageCount, features, licensePlate],
  );

  return id;
}
