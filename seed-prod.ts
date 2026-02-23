import {
  connectE2EDb,
  seedE2EVehicle,
  truncateAllE2ETables,
} from "./e2e/fixtures/db.fixture";
import "dotenv/config";

// Injecting production connection string
process.env.E2E_DATABASE_URL =
  "postgresql://neondb_owner:npg_fNjszMT8Pvl1@ep-young-wind-al228xlc-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function runSeed() {
  console.log("Connecting to NEON Production Database...");
  const db = await connectE2EDb();

  console.log("Emptying existing test tables... (just in case)");
  await truncateAllE2ETables(db);

  console.log("Inserting Premium SUV...");
  await seedE2EVehicle(db, {
    brand: "Mercedes-Benz",
    model: "GLE Coupé AMG",
    category: "LUXURY",
    status: "AVAILABLE",
    pricePerDayEurCents: 15000, // 150 EUR
    imageUrl:
      "https://images.unsplash.com/photo-1616422285623-14ff8046b07c?q=80&w=800",
  });

  console.log("Inserting Standard Sedan...");
  await seedE2EVehicle(db, {
    brand: "Volkswagen",
    model: "Passat",
    category: "SEDAN",
    status: "AVAILABLE",
    pricePerDayEurCents: 4500, // 45 EUR
    imageUrl:
      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=800",
  });

  console.log("Inserting Compact City Car...");
  await seedE2EVehicle(db, {
    brand: "Dacia",
    model: "Sandero",
    category: "COMPACT",
    status: "AVAILABLE",
    pricePerDayEurCents: 2000, // 20 EUR
    imageUrl:
      "https://images.unsplash.com/photo-1493238792000-8113da705763?q=80&w=800",
  });

  console.log("Checking DB Content...");
  const res = await db.query("SELECT * FROM vehicles;");
  console.log(`Successfully populated ${res.rows.length} vehicles!`);

  await db.end();
}

runSeed().catch(console.error);
