const { Client } = require("pg");
const { randomUUID } = require("crypto");

const E2E_DATABASE_URL =
  "postgresql://neondb_owner:npg_fNjszMT8Pvl1@ep-young-wind-al228xlc-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function createSchemaAndSeed() {
  console.log("Connecting to NEON Production Database...");
  const client = new Client({ connectionString: E2E_DATABASE_URL });
  await client.connect();

  console.log("Dropping existing tables to fix corruption...");
  await client.query(`DROP TABLE IF EXISTS reservation_documents CASCADE;`);
  await client.query(`DROP TABLE IF EXISTS chat_messages CASCADE;`);
  await client.query(`DROP TABLE IF EXISTS reservations CASCADE;`);
  await client.query(`DROP TABLE IF EXISTS users CASCADE;`);
  await client.query(`DROP TABLE IF EXISTS vehicles CASCADE;`);

  console.log("Recreating vehicles table...");
  await client.query(`
    CREATE TABLE vehicles (
      id UUID PRIMARY KEY,
      brand VARCHAR NOT NULL,
      model VARCHAR NOT NULL,
      description TEXT,
      category VARCHAR NOT NULL,
      status VARCHAR NOT NULL DEFAULT 'AVAILABLE',
      price_per_day_eur_cents INTEGER NOT NULL,
      image_url TEXT,
      image_urls TEXT[],
      transmission VARCHAR NOT NULL,
      fuel_type VARCHAR,
      seats INTEGER NOT NULL,
      doors INTEGER,
      luggage_count INTEGER NOT NULL,
      features TEXT[],
      year INTEGER,
      color VARCHAR,
      license_plate VARCHAR,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  console.log("Recreating users table...");
  await client.query(`
    CREATE TABLE users (
      id UUID PRIMARY KEY,
      email VARCHAR UNIQUE NOT NULL,
      password_hash VARCHAR,
      full_name VARCHAR(120) NOT NULL,
      phone VARCHAR(30),
      role VARCHAR NOT NULL DEFAULT 'USER',
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  console.log("Recreating reservations table...");
  await client.query(`
    CREATE TABLE reservations (
      id UUID PRIMARY KEY,
      guest_id UUID REFERENCES users(id),
      vehicle_id UUID REFERENCES vehicles(id),
      start_date TIMESTAMP WITH TIME ZONE NOT NULL,
      end_date TIMESTAMP WITH TIME ZONE NOT NULL,
      total_price_eur_cents INTEGER NOT NULL,
      status VARCHAR NOT NULL,
      stripe_payment_intent_id VARCHAR,
      pickup_location VARCHAR,
      dropoff_location VARCHAR,
      flight_number VARCHAR,
      notes TEXT,
      qr_code_hash VARCHAR,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  console.log("Recreating reservation_documents table...");
  await client.query(`
    CREATE TABLE reservation_documents (
      id UUID PRIMARY KEY,
      reservation_id UUID REFERENCES reservations(id),
      document_type VARCHAR NOT NULL,
      s3_key VARCHAR NOT NULL,
      status VARCHAR NOT NULL DEFAULT 'PENDING',
      rejection_reason TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  console.log("Recreating chat_messages table...");
  await client.query(`
    CREATE TABLE chat_messages (
      id UUID PRIMARY KEY,
      reservation_id UUID REFERENCES reservations(id),
      sender_id UUID REFERENCES users(id),
      sender_role VARCHAR NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  console.log("Inserting Luxury SUV...");
  await seedVehicle(client, {
    brand: "Mercedes-Benz",
    model: "GLE Coupé AMG",
    description: "The standard of luxury SUVs.",
    category: "LUXURY",
    status: "AVAILABLE",
    pricePerDayEurCents: 15000,
    imageUrl:
      "https://images.unsplash.com/photo-1616422285623-14ff8046b07c?q=80&w=800",
    transmission: "AUTOMATIC",
    seats: 5,
    luggage_count: 3,
  });

  console.log("Inserting Standard Sedan...");
  await seedVehicle(client, {
    brand: "Volkswagen",
    model: "Passat",
    description: "Reliable and comfortable for long trips.",
    category: "SEDAN",
    status: "AVAILABLE",
    pricePerDayEurCents: 4500,
    imageUrl:
      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=800",
    transmission: "AUTOMATIC",
    seats: 5,
    luggage_count: 2,
  });

  console.log("Inserting Compact City Car...");
  await seedVehicle(client, {
    brand: "Dacia",
    model: "Sandero",
    description: "Perfect for the city.",
    category: "COMPACT",
    status: "AVAILABLE",
    pricePerDayEurCents: 2000,
    imageUrl:
      "https://images.unsplash.com/photo-1493238792000-8113da705763?q=80&w=800",
    transmission: "MANUAL",
    seats: 5,
    luggage_count: 1,
  });

  console.log("Checking DB Content...");
  const res = await client.query("SELECT * FROM vehicles;");
  console.log(`Successfully populated ${res.rows.length} vehicles!`);

  await client.end();
}

async function seedVehicle(client, overrides) {
  const id = randomUUID();
  await client.query(
    `
    INSERT INTO vehicles (
      id, brand, model, description, category, status,
      price_per_day_eur_cents, image_url, image_urls,
      transmission, seats, luggage_count, features
    ) VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, ARRAY[]::text[],
      $9, $10, $11, ARRAY[]::text[]
    )
    `,
    [
      id,
      overrides.brand,
      overrides.model,
      overrides.description,
      overrides.category,
      overrides.status,
      overrides.pricePerDayEurCents,
      overrides.imageUrl,
      overrides.transmission,
      overrides.seats,
      overrides.luggage_count,
    ],
  );
}

createSchemaAndSeed().catch(console.error);
