/**
 * Mappers between the NestJS API shape and the frontend `Vehicle` type.
 * The backend stores prices as integer cents; the frontend uses decimal EUR.
 */

import type { Vehicle, VehicleCategory } from "@/types";

/** Raw shape returned by GET /api/v1/vehicles (and /api/v1/vehicles/:id) */
export interface ApiVehicle {
  id: string;
  brand: string;
  model: string;
  category: VehicleCategory;
  /** Price in Euro-cents (e.g. 16000 = 160 €) */
  pricePerDayEurCents: number;
  imageUrl: string;
  imageUrls: string[];
  transmission: "AUTOMATIC" | "MANUAL";
  seats: number;
  luggageCount: number;
  features: string[];
  status: "AVAILABLE" | "RENTED" | "MAINTENANCE" | "INACTIVE";
}

export interface ApiVehicleListResponse {
  data: ApiVehicle[];
  total: number;
}

export function mapApiVehicle(v: ApiVehicle): Vehicle {
  return {
    id: v.id,
    brand: v.brand,
    model: v.model,
    category: v.category,
    pricePerDay: v.pricePerDayEurCents / 100,
    currency: "EUR",
    imageUrl: v.imageUrl,
    imageUrls: v.imageUrls ?? [],
    transmission: v.transmission,
    seats: v.seats,
    luggageCount: v.luggageCount,
    features: v.features ?? [],
    isAvailable: v.status === "AVAILABLE",
  };
}
