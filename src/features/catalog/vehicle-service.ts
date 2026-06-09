import { serverFetch } from "@/lib/api/server-fetch";
import { adaptVehicleCard, adaptVehicleDetail } from "./vehicle-adapters";
import type {
  VehicleApi,
  VehicleCardModel,
  VehicleDetailApiResponse,
  VehicleDetailModel,
  VehiclesListApiResponse,
} from "./types";

export async function getVehicleCatalog(): Promise<VehicleCardModel[]> {
  const response = await serverFetch<VehiclesListApiResponse>("/vehicles");
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
