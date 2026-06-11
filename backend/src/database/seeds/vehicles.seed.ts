/**
 * Seed: inserts or updates the public CMN fleet used by catalog and homepage.
 * Run via: npm run seed:vehicles
 *
 * Image strategy:
 * - Uses deterministic absolute URLs derived from VEHICLE_ASSET_BASE_URL.
 * - The local default points to the app's public fleet assets.
 * - Override VEHICLE_ASSET_BASE_URL in deployed environments to use the
 *   production site or CDN origin serving the same folder structure.
 */
import "dotenv/config";
import { AppDataSource } from "../../config/data-source";
import {
  Vehicle as VehicleEntity,
  Transmission,
  VehicleCategory,
  VehicleStatus,
} from "../../vehicles/vehicle.entity";
import { Reservation } from "../../reservations/reservation.entity";

const ASSET_BASE_URL = (
  process.env.VEHICLE_ASSET_BASE_URL ??
  "http://localhost:3600/fleet/cmn"
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

const LEGACY_SEED_LICENSE_PLATES = [
  "22145-A-1",
  "33112-B-7",
  "44098-C-3",
  "55877-D-9",
  "11904-E-2",
  "66721-F-5",
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
  imageFileNames?: string[];
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
    imageFileNames: ["01.webp", "02.webp", "03.webp", "04.webp"],
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
    imageFileNames: ["01.webp", "02.webp", "03.webp", "04.webp"],
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
    imageFileNames: ["01.webp", "02.webp"],
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
    imageFileNames: ["01.webp", "02.webp", "03.webp", "04.webp"],
  },
  {
    brand: "Hyundai",
    model: "Elantra",
    licensePlate: "CMN-NXM-005",
    slug: "hyundai-elantra",
    category: VehicleCategory.SEDAN,
    pricePerDayEurCents: 4300,
    transmission: Transmission.AUTOMATIC,
    seats: 5,
    luggageCount: 3,
    features: [...SEDAN_FEATURES],
    imageFileNames: ["01.webp", "02.webp", "03.webp", "04.webp"],
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
    imageFileNames: ["01.webp", "02.webp", "03.webp", "04.webp"],
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
    imageFileNames: ["01.webp", "02.webp", "03.webp", "04.webp"],
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
    imageFileNames: ["01.webp", "02.webp", "03.webp", "04.webp"],
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
    imageFileNames: ["01.webp", "02.webp", "03.webp", "04.webp"],
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
    imageFileNames: ["01.webp", "02.webp"],
  },
  {
    brand: "Range Rover",
    model: "Evoque",
    licensePlate: "CMN-NXM-011",
    slug: "range-rover-evoque",
    category: VehicleCategory.LUXURY,
    pricePerDayEurCents: 15500,
    transmission: Transmission.AUTOMATIC,
    seats: 5,
    luggageCount: 3,
    features: [...LUXURY_FEATURES],
    imageFileNames: ["01.webp", "02.webp", "03.webp", "04.webp"],
  },
] as const;

function buildImageUrls(slug: string, imageFileNames?: string[]): string[] {
  const fileNames = imageFileNames?.length
    ? imageFileNames
    : ["01.webp", "02.webp", "03.webp"];

  return fileNames.map((fileName) => `${ASSET_BASE_URL}/${slug}/${fileName}`);
}

async function seed() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(VehicleEntity);
  const reservationsRepo = AppDataSource.getRepository(Reservation);

  const rows = FLEET.map((vehicle) => {
    const imageUrls = buildImageUrls(vehicle.slug, vehicle.imageFileNames);

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

  const legacyVehicles = await repo.find({
    where: LEGACY_SEED_LICENSE_PLATES.map((licensePlate) => ({ licensePlate })),
  });

  for (const legacyVehicle of legacyVehicles) {
    const reservationCount = await reservationsRepo.count({
      where: { vehicleId: legacyVehicle.id },
    });

    if (reservationCount === 0) {
      await repo.delete({ id: legacyVehicle.id });
      console.log(`Removed legacy seed vehicle ${legacyVehicle.licensePlate}.`);
      continue;
    }

    if (legacyVehicle.status !== VehicleStatus.INACTIVE) {
      legacyVehicle.status = VehicleStatus.INACTIVE;
      await repo.save(legacyVehicle);
      console.log(
        `Legacy vehicle ${legacyVehicle.licensePlate} retained due to reservations and marked INACTIVE.`,
      );
    }
  }

  for (const row of rows) {
    const existing = await repo.findOne({
      where: { licensePlate: row.licensePlate },
    });

    if (existing) {
      Object.assign(existing, row);
      await repo.save(existing);
      console.log(`Updated ${row.licensePlate}.`);
      continue;
    }

    const created = repo.create(row);
    await repo.save(created);
    console.log(`Inserted ${row.licensePlate}.`);
  }

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
