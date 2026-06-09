import { serverFetch } from "@/lib/api/server-fetch";
import { adaptVehicleCard, adaptVehicleDetail } from "./vehicle-adapters";
import type {
  VehicleCategory,
  VehicleApi,
  VehicleCardModel,
  VehicleDetailApiResponse,
  VehicleDetailModel,
  VehiclesListApiResponse,
} from "./types";

export type VehicleCatalogQuery = {
  category?: VehicleCategory;
};

export async function getVehicleCatalog(
  query: VehicleCatalogQuery = {},
): Promise<VehicleCardModel[]> {
  const params = new URLSearchParams();

  if (query.category) {
    params.set("category", query.category);
  }

  const path = params.size > 0 ? `/vehicles?${params.toString()}` : "/vehicles";
  const response = await serverFetch<VehiclesListApiResponse>(path);
  const rows = Array.isArray(response.data) ? response.data : [];

  return rows
    .map((item) => adaptVehicleCard(item as VehicleApi))
    .filter((item): item is VehicleCardModel => item !== null);
}

export async function getVehicleDetail(
  vehicleId: string,
): Promise<VehicleDetailModel | null> {
  const response = await serverFetch<VehicleDetailApiResponse>(
    `/vehicles/${encodeURIComponent(vehicleId)}`,
  );

  return adaptVehicleDetail((response.data ?? {}) as VehicleApi);
}
