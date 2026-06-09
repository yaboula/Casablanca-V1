import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api/errors";
import { getVehicleDetail } from "@/features/catalog/vehicle-service";
import { VehicleDetailSummary } from "@/features/catalog/VehicleDetailSummary";

type VehicleDetailPageProps = {
  params: Promise<{
    vehicleId: string;
  }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: VehicleDetailPageProps): Promise<Metadata> {
  const { vehicleId } = await params;

  try {
    const vehicle = await getVehicleDetail(vehicleId);

    if (!vehicle) {
      return {
        title: "Vehicule introuvable",
      };
    }

    return {
      title: vehicle.name,
      description: `${vehicle.name} dans le catalogue public Casablanca V1.`,
    };
  } catch {
    return {
      title: "Detail vehicule",
    };
  }
}

export default async function VehicleDetailPage({
  params,
}: VehicleDetailPageProps) {
  const { vehicleId } = await params;
  let vehicle;

  try {
    vehicle = await getVehicleDetail(vehicleId);
  } catch (error) {
    if (error instanceof ApiError && error.payload.kind === "not-found") {
      notFound();
    }

    throw error;
  }

  if (!vehicle) {
    notFound();
  }

  return <VehicleDetailSummary vehicle={vehicle} />;
}
