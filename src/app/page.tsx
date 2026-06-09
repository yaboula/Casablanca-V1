import type { Metadata } from "next";
import { PublicHome } from "@/features/public/PublicHome";
import { getVehicleCatalog } from "@/features/catalog/vehicle-service";
import type { VehicleCardModel } from "@/features/catalog/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Airport car rental",
  description:
    "Reserve a real vehicle before landing at Casablanca Mohammed V Airport.",
};

export default async function HomePage() {
  let featuredVehicles: VehicleCardModel[] = [];

  try {
    featuredVehicles = (await getVehicleCatalog()).slice(0, 3);
  } catch {
    featuredVehicles = [];
  }

  return <PublicHome featuredVehicles={featuredVehicles} />;
}
