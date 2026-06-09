import type { Metadata } from "next";
import { ApiError } from "@/lib/api/errors";
import {
  CatalogEmptyState,
  CatalogErrorState,
} from "@/features/catalog/CatalogStates";
import { VehicleCategoryFilter } from "@/features/catalog/VehicleCategoryFilter";
import { getVehicleCatalog } from "@/features/catalog/vehicle-service";
import { VehicleGrid } from "@/features/catalog/VehicleGrid";
import type { VehicleCategory } from "@/features/catalog/types";
import { VEHICLE_CATEGORIES } from "@/features/catalog/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fleet",
  description:
    "Browse vehicles available at Casablanca Mohammed V Airport. Daily rates in euros. Reserve the exact make and model.",
};

type CatalogPageProps = {
  searchParams: Promise<{
    category?: string;
  }>;
};

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const { category: rawCategory } = await searchParams;
  const activeCategory = parseCategory(rawCategory);
  let vehicles;

  try {
    vehicles = await getVehicleCatalog({
      ...(activeCategory ? { category: activeCategory } : {}),
    });
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.payload.message
        : "The backend catalog could not be reached.";

    return (
      <section className="nx-container py-10 md:py-14">
        <CatalogHeader activeCategory={activeCategory} vehicleCount={0} />
        <CatalogErrorState message={message} />
      </section>
    );
  }

  return (
    <section className="nx-container py-10 md:py-14">
      <CatalogHeader
        activeCategory={activeCategory}
        vehicleCount={vehicles.length}
      />
      {vehicles.length > 0 ? (
        <VehicleGrid vehicles={vehicles} />
      ) : (
        <CatalogEmptyState />
      )}
    </section>
  );
}

function CatalogHeader({
  activeCategory,
  vehicleCount,
}: {
  activeCategory: VehicleCategory | null;
  vehicleCount: number;
}) {
  return (
    <div className="space-y-8 mb-8">
      <div className="flex flex-col gap-2">
        <span className="nx-eyebrow text-neutral-500 font-medium">
          Casablanca Mohammed V · the fleet
        </span>
        <h1 className="nx-h2 font-display font-light text-neutral-900 leading-none">
          Choose your vehicle
        </h1>
        <p className="nx-lead text-neutral-600 max-w-2xl mt-1 font-light leading-relaxed">
          Every car is locked to its exact make, model and trim — never a category, never a substitute. Choose from our backend fleet below.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 border-b border-neutral-100 pb-6">
        <VehicleCategoryFilter activeCategory={activeCategory} />
        <span className="text-xs text-neutral-500 font-semibold shrink-0 bg-neutral-50 border border-neutral-200/50 rounded-full px-4 py-1.5 shadow-sm">
          {vehicleCount} {vehicleCount === 1 ? "vehicle" : "vehicles"} available
        </span>
      </div>
    </div>
  );
}

function parseCategory(category: string | undefined): VehicleCategory | null {
  return VEHICLE_CATEGORIES.includes(category as VehicleCategory)
    ? (category as VehicleCategory)
    : null;
}
