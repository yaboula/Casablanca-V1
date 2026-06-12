/**
 * Seed: inserts or updates the public CMN fleet used by catalog and homepage.
 * Run via: npm run seed:vehicles
 *
 * Image strategy:
 * - Uses final Cloudinary URLs for each exact-model image asset.
 * - Preserves a deterministic fleet and gallery order for the frontend.
 * - Retires any previous seed vehicles from the active catalog while
 *   preserving history for vehicles that already have reservations.
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

const CLOUDINARY_CMN_IMAGES = {
  "dacia-sandero-stepway": [
    "https://res.cloudinary.com/do7czbgfp/image/upload/v1781181871/nexus-mobility/fleet/cmn/dacia-sandero-stepway/01.webp",
    "https://res.cloudinary.com/do7czbgfp/image/upload/v1781180454/nexus-mobility/fleet/cmn/dacia-sandero-stepway/02.webp",
    "https://res.cloudinary.com/do7czbgfp/image/upload/v1781180455/nexus-mobility/fleet/cmn/dacia-sandero-stepway/03.webp",
  ],
  "renault-clio-5": [
    "https://res.cloudinary.com/do7czbgfp/image/upload/v1781180457/nexus-mobility/fleet/cmn/renault-clio-5/01.webp",
    "https://res.cloudinary.com/do7czbgfp/image/upload/v1781180457/nexus-mobility/fleet/cmn/renault-clio-5/02.webp",
    "https://res.cloudinary.com/do7czbgfp/image/upload/v1781181872/nexus-mobility/fleet/cmn/renault-clio-5/03.webp",
    "https://res.cloudinary.com/do7czbgfp/image/upload/v1781180459/nexus-mobility/fleet/cmn/renault-clio-5/04.webp",
  ],
  "fiat-500-hybrid": [
    "https://res.cloudinary.com/do7czbgfp/image/upload/v1781180459/nexus-mobility/fleet/cmn/fiat-500-hybrid/01.webp",
    "https://res.cloudinary.com/do7czbgfp/image/upload/v1781180460/nexus-mobility/fleet/cmn/fiat-500-hybrid/02.webp",
  ],
  "dacia-logan": [
    "https://res.cloudinary.com/do7czbgfp/image/upload/v1781180461/nexus-mobility/fleet/cmn/dacia-logan/01.webp",
    "https://res.cloudinary.com/do7czbgfp/image/upload/v1781180462/nexus-mobility/fleet/cmn/dacia-logan/02.webp",
    "https://res.cloudinary.com/do7czbgfp/image/upload/v1781180462/nexus-mobility/fleet/cmn/dacia-logan/03.webp",
    "https://res.cloudinary.com/do7czbgfp/image/upload/v1781180463/nexus-mobility/fleet/cmn/dacia-logan/04.webp",
  ],
  "hyundai-elantra": [
    "https://res.cloudinary.com/do7czbgfp/image/upload/v1781180464/nexus-mobility/fleet/cmn/hyundai-elantra/01.webp",
    "https://res.cloudinary.com/do7czbgfp/image/upload/v1781180464/nexus-mobility/fleet/cmn/hyundai-elantra/02.webp",
    "https://res.cloudinary.com/do7czbgfp/image/upload/v1781180465/nexus-mobility/fleet/cmn/hyundai-elantra/03.webp",
    "https://res.cloudinary.com/do7czbgfp/image/upload/v1781180466/nexus-mobility/fleet/cmn/hyundai-elantra/04.webp",
  ],
  "toyota-corolla": [
    "https://res.cloudinary.com/do7czbgfp/image/upload/v1781180480/nexus-mobility/fleet/cmn/toyota-corolla/01.webp",
    "https://res.cloudinary.com/do7czbgfp/image/upload/v1781180480/nexus-mobility/fleet/cmn/toyota-corolla/02.webp",
    "https://res.cloudinary.com/do7czbgfp/image/upload/v1781180481/nexus-mobility/fleet/cmn/toyota-corolla/03.webp",
    "https://res.cloudinary.com/do7czbgfp/image/upload/v1781180482/nexus-mobility/fleet/cmn/toyota-corolla/04.webp",
  ],
  "dacia-duster": [
    "https://res.cloudinary.com/do7czbgfp/image/upload/v1781180467/nexus-mobility/fleet/cmn/dacia-duster/01.webp",
    "https://res.cloudinary.com/do7czbgfp/image/upload/v1781180468/nexus-mobility/fleet/cmn/dacia-duster/02.webp",
    "https://res.cloudinary.com/do7czbgfp/image/upload/v1781180468/nexus-mobility/fleet/cmn/dacia-duster/03.webp",
    "https://res.cloudinary.com/do7czbgfp/image/upload/v1781180469/nexus-mobility/fleet/cmn/dacia-duster/04.webp",
  ],
  "kia-sportage": [
    "https://res.cloudinary.com/do7czbgfp/image/upload/v1781180470/nexus-mobility/fleet/cmn/kia-sportage/01.webp",
    "https://res.cloudinary.com/do7czbgfp/image/upload/v1781180471/nexus-mobility/fleet/cmn/kia-sportage/02.webp",
    "https://res.cloudinary.com/do7czbgfp/image/upload/v1781180471/nexus-mobility/fleet/cmn/kia-sportage/03.webp",
    "https://res.cloudinary.com/do7czbgfp/image/upload/v1781180472/nexus-mobility/fleet/cmn/kia-sportage/04.webp",
  ],
  "hyundai-tucson": [
    "https://res.cloudinary.com/do7czbgfp/image/upload/v1781180473/nexus-mobility/fleet/cmn/hyundai-tucson/01.webp",
    "https://res.cloudinary.com/do7czbgfp/image/upload/v1781180474/nexus-mobility/fleet/cmn/hyundai-tucson/02.webp",
    "https://res.cloudinary.com/do7czbgfp/image/upload/v1781180475/nexus-mobility/fleet/cmn/hyundai-tucson/03.webp",
    "https://res.cloudinary.com/do7czbgfp/image/upload/v1781180475/nexus-mobility/fleet/cmn/hyundai-tucson/04.webp",
  ],
  "bmw-x1": [
    "https://res.cloudinary.com/do7czbgfp/image/upload/v1781180476/nexus-mobility/fleet/cmn/bmw-x1/01.webp",
    "https://res.cloudinary.com/do7czbgfp/image/upload/v1781181873/nexus-mobility/fleet/cmn/bmw-x1/02.webp",
  ],
  "range-rover-evoque": [
    "https://res.cloudinary.com/do7czbgfp/image/upload/v1781180477/nexus-mobility/fleet/cmn/range-rover-evoque/01.webp",
    "https://res.cloudinary.com/do7czbgfp/image/upload/v1781180478/nexus-mobility/fleet/cmn/range-rover-evoque/02.webp",
    "https://res.cloudinary.com/do7czbgfp/image/upload/v1781180479/nexus-mobility/fleet/cmn/range-rover-evoque/03.webp",
    "https://res.cloudinary.com/do7czbgfp/image/upload/v1781180479/nexus-mobility/fleet/cmn/range-rover-evoque/04.webp",
  ],
} as const;

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
    model: "Elantra",
    licensePlate: "CMN-NXM-005",
    slug: "hyundai-elantra",
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
  },
] as const;

function getImageUrls(slug: keyof typeof CLOUDINARY_CMN_IMAGES): string[] {
  return [...CLOUDINARY_CMN_IMAGES[slug]];
}

async function seed() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(VehicleEntity);
  const reservationsRepo = AppDataSource.getRepository(Reservation);

  const rows = FLEET.map((vehicle) => {
    const imageUrls = getImageUrls(
      vehicle.slug as keyof typeof CLOUDINARY_CMN_IMAGES,
    );

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
  console.log("Image source: Cloudinary exact-model assets");

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

  const activeSeedPlates = new Set(rows.map((row) => row.licensePlate));
  const existingVehicles = await repo.find();

  for (const vehicle of existingVehicles) {
    if (activeSeedPlates.has(vehicle.licensePlate)) {
      continue;
    }

    const reservationCount = await reservationsRepo.count({
      where: { vehicleId: vehicle.id },
    });

    if (reservationCount === 0) {
      await repo.delete({ id: vehicle.id });
      console.log(
        `Removed obsolete fleet vehicle ${vehicle.licensePlate} (${vehicle.brand} ${vehicle.model}).`,
      );
      continue;
    }

    if (vehicle.status !== VehicleStatus.INACTIVE) {
      vehicle.status = VehicleStatus.INACTIVE;
      await repo.save(vehicle);
      console.log(
        `Archived obsolete fleet vehicle ${vehicle.licensePlate} (${vehicle.brand} ${vehicle.model}) because it has reservations.`,
      );
    }
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
