/**
 * db.fixture.ts
 *
 * Direct PostgreSQL client helpers for E2E test isolation.
 * These run OUTSIDE the NestJS process — they connect directly to the
 * database from the Playwright test runner.
 *
 * Usage:
 *   const db = await connectE2EDb();
 *   await truncateAllE2ETables(db);
 *   const vehicleId = await seedE2EVehicle(db);
 *   await db.end();
 */

import { Client } from 'pg';
import { randomUUID } from 'crypto';

const E2E_DATABASE_URL =
  process.env.E2E_DATABASE_URL ??
  'postgresql://nexus:nexus_secret@localhost:5433/nexus_e2e_db';

export async function connectE2EDb(): Promise<Client> {
  const client = new Client({ connectionString: E2E_DATABASE_URL });
  try {
    await client.connect();
  } catch (err) {
    throw new Error(
      `Unable to connect to E2E database at ${E2E_DATABASE_URL}. ` +
        `Run "npm run docker:dev" and "npm run db:e2e:prepare" before Playwright. ` +
        `Original error: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  return client;
}

/**
 * TRUNCATE all relevant tables with CASCADE + reset sequences.
 * Call this in beforeEach to guarantee a clean slate.
 */
export async function truncateAllE2ETables(client: Client): Promise<void> {
  await client.query(`
    TRUNCATE TABLE
      reservation_documents,
      chat_messages,
      reservations,
      users,
      vehicles
    RESTART IDENTITY CASCADE
  `);
}

interface SeedVehicleOptions {
  brand?: string;
  model?: string;
  category?: 'SEDAN' | 'SUV' | 'LUXURY' | 'COMPACT';
  status?: 'AVAILABLE' | 'MAINTENANCE' | 'RENTED';
  pricePerDayEurCents?: number;
  imageUrl?: string;
}

/**
 * Insert a test vehicle directly into the DB.
 * Returns the generated UUID.
 */
export async function seedE2EVehicle(
  client: Client,
  overrides: SeedVehicleOptions = {},
): Promise<string> {
  const id = randomUUID();
  const {
    brand = 'Test Brand',
    model = 'E2E Model',
    category = 'SUV',
    status = 'AVAILABLE',
    pricePerDayEurCents = 5000,
    imageUrl = 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800',
  } = overrides;

  await client.query(
    `
    INSERT INTO vehicles (
      id, brand, model, category, status,
      price_per_day_eur_cents, image_url, image_urls,
      transmission, seats, luggage_count, features
    ) VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, ARRAY[]::text[],
      'AUTOMATIC', 5, 2, ARRAY[]::text[]
    )
    `,
    [id, brand, model, category, status, pricePerDayEurCents, imageUrl],
  );

  return id;
}
