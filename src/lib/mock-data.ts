import type { Vehicle } from "@/types";

// ============================================================
// Mock vehicle data — replaced by API calls when backend is ready
// ============================================================

export const MOCK_VEHICLES: Vehicle[] = [
  {
    id: "v1",
    model: "A4",
    brand: "Audi",
    category: "SEDAN",
    pricePerDay: 160,
    currency: "EUR",
    imageUrl: "/images/vehicles/audi-a4.webp",
    transmission: "AUTOMATIC",
    seats: 5,
    luggageCount: 2,
    features: ["SIM 5GB", "Tag Jawaz", "Seguro Todo Riesgo", "Sin límite km"],
    isAvailable: true,
  },
  {
    id: "v2",
    model: "Clase C",
    brand: "Mercedes",
    category: "SEDAN",
    pricePerDay: 190,
    currency: "EUR",
    imageUrl: "/images/vehicles/mercedes-c.webp",
    transmission: "AUTOMATIC",
    seats: 5,
    luggageCount: 2,
    features: ["SIM 5GB", "Tag Jawaz", "Seguro Todo Riesgo", "Sin límite km"],
    isAvailable: true,
  },
  {
    id: "v3",
    model: "Tucson",
    brand: "Hyundai",
    category: "SUV",
    pricePerDay: 120,
    currency: "EUR",
    imageUrl: "/images/vehicles/hyundai-tucson.webp",
    transmission: "AUTOMATIC",
    seats: 5,
    luggageCount: 3,
    features: ["SIM 5GB", "Tag Jawaz", "Seguro Todo Riesgo"],
    isAvailable: true,
  },
  {
    id: "v4",
    model: "Serie 3",
    brand: "BMW",
    category: "LUXURY",
    pricePerDay: 220,
    currency: "EUR",
    imageUrl: "/images/vehicles/bmw-3.webp",
    transmission: "AUTOMATIC",
    seats: 5,
    luggageCount: 2,
    features: ["SIM 5GB", "Tag Jawaz", "Seguro Todo Riesgo", "Sin límite km", "GPS integrado"],
    isAvailable: true,
  },
  {
    id: "v5",
    model: "Clio",
    brand: "Renault",
    category: "COMPACT",
    pricePerDay: 65,
    currency: "EUR",
    imageUrl: "/images/vehicles/renault-clio.webp",
    transmission: "MANUAL",
    seats: 5,
    luggageCount: 1,
    features: ["Tag Jawaz", "Seguro Todo Riesgo"],
    isAvailable: true,
  },
  {
    id: "v6",
    model: "Range Rover Evoque",
    brand: "Land Rover",
    category: "SUV",
    pricePerDay: 280,
    currency: "EUR",
    imageUrl: "/images/vehicles/range-rover-evoque.webp",
    transmission: "AUTOMATIC",
    seats: 5,
    luggageCount: 3,
    features: ["SIM 5GB", "Tag Jawaz", "Seguro Todo Riesgo", "Sin límite km", "GPS integrado"],
    isAvailable: true,
  },
];

/** Category display labels */
export const CATEGORY_LABELS: Record<string, string> = {
  ALL: "Todos",
  SEDAN: "Sedán",
  SUV: "SUV",
  LUXURY: "Lujo",
  COMPACT: "Compacto",
};

/** Categories in display order */
export const CATEGORIES = ["ALL", "SEDAN", "SUV", "LUXURY", "COMPACT"] as const;

/** Seeded pseudo-random heat values for vehicle occupancy bars */
export function getOccupancyHeat(vehicleId: string): number[] {
  let seed = 0;
  for (let i = 0; i < vehicleId.length; i++) seed += vehicleId.charCodeAt(i);
  return Array.from({ length: 7 }, (_, i) => {
    const x = Math.sin(seed * (i + 1)) * 10000;
    return Math.abs(x - Math.floor(x));
  });
}
