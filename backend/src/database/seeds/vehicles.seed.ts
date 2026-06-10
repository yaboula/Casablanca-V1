/**
 * Seed: inserts or updates the public CMN fleet used by catalog and homepage.
 * Run via: npm run seed:vehicles
 *
 * Image strategy:
 * - Uses deterministic absolute URLs derived from VEHICLE_ASSET_BASE_URL.
 * - These are placeholders for owned/CDN assets until final uploads are ready.
 * - Default base is intentionally a reserved .example domain to avoid pretending
 *   generic stock imagery is the final exact-model source.
 */
import "dotenv/config";
import { AppDataSource } from "../../config/data-source";
import {
  Transmission,
  Vehicle,
  VehicleCategory,
  VehicleStatus,
} from "../../vehicles/vehicle.entity";

const ASSET_BASE_URL = (
  process.env.VEHICLE_ASSET_BASE_URL ??
  "https://assets.nexusmobility.example/fleet/cmn"
).replace(/\/+$/, "");

const COMPACT_FEATURES = [
  "Air conditioning",
  "Bluetooth",
  "USB charging",
  "Fuel efficient",
  "Airport pickup",
] as const;

const SEDAN_FEATURES = [
  "Air conditioning",
  "Comfort seating",
  "Large boot",
  "Smooth highway ride",
  "Airport pickup",
] as const;

const SUV_FEATURES = [
  "Higher clearance",
  "Family luggage space",
  "Road-trip ready",
  "Air conditioning",
  "Airport pickup",
] as const;

const LUXURY_FEATURES = [
  "Premium cabin",
  "Automatic transmission",
  "Executive comfort",
  "Quiet ride",
  "Airport pickup",
] as const;

type SeedVehicleInput = {
  brand: string;
  model: string;
  licensePlate: string;
  slug: string;
  category: VehicleCategory;
  pricePerDayEurCents: number;
  transmission: Transmission;
  seats: number;
  luggageCount: number;
  features: string[];
};

const FLEET: SeedVehicleInput[] = [
  {
    brand: "Dacia",
    model: "Sandero Stepway",
    licensePlate: "CMN-NXM-001",
    slug: "dacia-sandero-stepway",
    category: VehicleCategory.COMPACT,
    pricePerDayEurCents: 2900,
    transmission: Transmission.MANUAL,
    seats: 5,
    luggageCount: 2,
    features: [...COMPACT_FEATURES],
  },
  {
    brand: "Renault",
    model: "Clio 5",
    licensePlate: "CMN-NXM-002",
    slug: "renault-clio-5",
    category: VehicleCategory.COMPACT,
    pricePerDayEurCents: 3500,
    transmission: Transmission.MANUAL,
    seats: 5,
    luggageCount: 2,
    features: [...COMPACT_FEATURES],
  },
  {
    brand: "Fiat",
    model: "500 Hybrid",
    licensePlate: "CMN-NXM-003",
    slug: "fiat-500-hybrid",
    category: VehicleCategory.COMPACT,
    pricePerDayEurCents: 3900,
    transmission: Transmission.MANUAL,
    seats: 4,
    luggageCount: 1,
    features: [...COMPACT_FEATURES],
  },
  {
    brand: "Dacia",
    model: "Logan",
    licensePlate: "CMN-NXM-004",
    slug: "dacia-logan",
    category: VehicleCategory.SEDAN,
    pricePerDayEurCents: 3400,
    transmission: Transmission.MANUAL,
    seats: 5,
    luggageCount: 3,
    features: [...SEDAN_FEATURES],
  },
  {
    brand: "Hyundai",
    model: "Accent",
    licensePlate: "CMN-NXM-005",
    slug: "hyundai-accent",
    category: VehicleCategory.SEDAN,
    pricePerDayEurCents: 4300,
    transmission: Transmission.AUTOMATIC,
    seats: 5,
    luggageCount: 3,
    features: [...SEDAN_FEATURES],
  },
  {
    brand: "Toyota",
    model: "Corolla",
    licensePlate: "CMN-NXM-006",
    slug: "toyota-corolla",
    category: VehicleCategory.SEDAN,
    pricePerDayEurCents: 5200,
    transmission: Transmission.AUTOMATIC,
    seats: 5,
    luggageCount: 3,
    features: [...SEDAN_FEATURES],
  },
  {
    brand: "Dacia",
    model: "Duster",
    licensePlate: "CMN-NXM-007",
    slug: "dacia-duster",
    category: VehicleCategory.SUV,
    pricePerDayEurCents: 4900,
    transmission: Transmission.MANUAL,
    seats: 5,
    luggageCount: 4,
    features: [...SUV_FEATURES],
  },
  {
    brand: "Kia",
    model: "Sportage",
    licensePlate: "CMN-NXM-008",
    slug: "kia-sportage",
    category: VehicleCategory.SUV,
    pricePerDayEurCents: 7200,
    transmission: Transmission.AUTOMATIC,
    seats: 5,
    luggageCount: 4,
    features: [...SUV_FEATURES],
  },
  {
    brand: "Hyundai",
    model: "Tucson",
    licensePlate: "CMN-NXM-009",
    slug: "hyundai-tucson",
    category: VehicleCategory.SUV,
    pricePerDayEurCents: 8200,
    transmission: Transmission.AUTOMATIC,
    seats: 5,
    luggageCount: 4,
    features: [...SUV_FEATURES],
  },
  {
    brand: "BMW",
    model: "X1",
    licensePlate: "CMN-NXM-010",
    slug: "bmw-x1",
    category: VehicleCategory.LUXURY,
    pricePerDayEurCents: 9500,
    transmission: Transmission.AUTOMATIC,
    seats: 5,
    luggageCount: 3,
    features: [...LUXURY_FEATURES],
  },
  {
    brand: "Mercedes-Benz",
    model: "C-Class",
    licensePlate: "CMN-NXM-011",
    slug: "mercedes-benz-c-class",
    category: VehicleCategory.LUXURY,
    pricePerDayEurCents: 12500,
    transmission: Transmission.AUTOMATIC,
    seats: 5,
    luggageCount: 3,
    features: [...LUXURY_FEATURES],
  },
  {
    brand: "Range Rover",
    model: "Evoque",
    licensePlate: "CMN-NXM-012",
    slug: "range-rover-evoque",
    category: VehicleCategory.LUXURY,
    pricePerDayEurCents: 15500,
    transmission: Transmission.AUTOMATIC,
    seats: 5,
    luggageCount: 3,
    features: [...LUXURY_FEATURES],
  },
] as const;

function buildImageUrls(slug: string): string[] {
  return [
    `${ASSET_BASE_URL}/${slug}/01.webp`,
    `${ASSET_BASE_URL}/${slug}/02.webp`,
    `${ASSET_BASE_URL}/${slug}/03.webp`,
  ];
}

async function seed() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(Vehicle);

  const rows = FLEET.map((vehicle) => {
    const imageUrls = buildImageUrls(vehicle.slug);

    return {
      brand: vehicle.brand,
      model: vehicle.model,
      licensePlate: vehicle.licensePlate,
      category: vehicle.category,
      pricePerDayEurCents: vehicle.pricePerDayEurCents,
      imageUrl: imageUrls[0],
      imageUrls,
      transmission: vehicle.transmission,
      seats: vehicle.seats,
      luggageCount: vehicle.luggageCount,
      features: vehicle.features,
      status: VehicleStatus.AVAILABLE,
    };
  });

  console.log("Seeding realistic CMN fleet...");
  console.log(`Asset base URL: ${ASSET_BASE_URL}`);

  await repo.upsert(rows, ["licensePlate"]);

  console.log(`Seeded ${rows.length} vehicles.`);

  await AppDataSource.destroy();
}

seed().catch(async (err) => {
  console.error("Vehicle seed failed:", err);
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  process.exit(1);
});
