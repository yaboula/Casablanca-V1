export type VehicleCategory = "SEDAN" | "SUV" | "LUXURY" | "COMPACT";

export const VEHICLE_CATEGORIES: VehicleCategory[] = [
  "SEDAN",
  "SUV",
  "LUXURY",
  "COMPACT",
];

export type VehicleStatus =
  | "AVAILABLE"
  | "RENTED"
  | "MAINTENANCE"
  | "INACTIVE";

export type VehicleTransmission = "AUTOMATIC" | "MANUAL";

export type VehicleApi = {
  id?: unknown;
  brand?: unknown;
  model?: unknown;
  category?: unknown;
  pricePerDayEurCents?: unknown;
  imageUrl?: unknown;
  imageUrls?: unknown;
  transmission?: unknown;
  seats?: unknown;
  luggageCount?: unknown;
  features?: unknown;
  status?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type VehiclesListApiResponse = {
  data?: unknown;
  total?: unknown;
};

export type VehicleDetailApiResponse = {
  data?: unknown;
};

export type VehicleCardModel = {
  id: string;
  name: string;
  category: VehicleCategory | null;
  pricePerDayEurCents: number;
  primaryImageUrl: string | null;
  transmission: VehicleTransmission | null;
  seats: number | null;
  luggageCount: number | null;
  featureLabels: string[];
};

export type VehicleDetailModel = VehicleCardModel & {
  brand: string;
  model: string;
  status: VehicleStatus | null;
  imageUrls: string[];
};
