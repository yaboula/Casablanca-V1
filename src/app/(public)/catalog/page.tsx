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
    "Browse vehicles available at Casablanca Mohammed V Airport. Daily rates shown in EUR and approximate MAD for easier local planning.",
};

type CatalogPageProps = {
  searchParams: Promise<{
    category?: string;
  }>;
};

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const { category: rawCategory } = await searchParams;
  const activeCategory = parseCategory(rawCategory);
  let allVehicles;
  let vehicles;

  try {
    allVehicles = await getVehicleCatalog();
    vehicles = activeCategory
      ? allVehicles.filter((vehicle) => vehicle.category === activeCategory)
      : allVehicles;
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.payload.message
        : "The vehicle catalog could not be loaded at this time. Please try again.";

    return (
      <section className="nx-container py-10 md:py-14">
        <CatalogHeader
          activeCategory={activeCategory}
          categoryCounts={createCategoryCounts([])}
          vehicleCount={0}
        />
        <CatalogErrorState message={message} />
      </section>
    );
  }

  return (
    <section className="nx-container py-10 md:py-14">
      <CatalogHeader
        activeCategory={activeCategory}
        categoryCounts={createCategoryCounts(allVehicles)}
        vehicleCount={vehicles.length}
      />
      {vehicles.length > 0 ? (
        <VehicleGrid vehicles={vehicles} />
      ) : (
        <CatalogEmptyState activeCategory={activeCategory} />
      )}
    </section>
  );
}

function CatalogHeader({
  activeCategory,
  categoryCounts,
  vehicleCount,
}: {
  activeCategory: VehicleCategory | null;
  categoryCounts: Record<VehicleCategory | "ALL", number>;
  vehicleCount: number;
}) {
  const availabilityLabel = activeCategory
    ? `${vehicleCount} ${formatCategoryLabel(activeCategory, vehicleCount)} available`
    : `${vehicleCount} ${vehicleCount === 1 ? "vehicle" : "vehicles"} available`;

  return (
    <div className="space-y-8 mb-8">
      <div className="grid gap-6 border-b border-neutral-200 bg-white pb-8 md:grid-cols-[1fr_minmax(260px,360px)] md:items-end">
        <div className="flex flex-col gap-2">
          <span className="nx-eyebrow text-neutral-500 font-medium">
            Casablanca Mohammed V - curated CMN fleet
          </span>
          <h1 className="nx-h2 font-display font-light text-neutral-900 leading-none">
            Choose your exact airport vehicle.
          </h1>
          <p className="nx-lead text-neutral-600 max-w-2xl mt-1 font-light leading-relaxed">
            Browse the live CMN fleet, compare daily rates in EUR and MAD,
            and reserve the car you will collect at arrival.
          </p>
        </div>
        <div className="rounded-[1.25rem] border border-neutral-200 bg-[#FAFAFA] p-5 text-sm text-neutral-600 shadow-sm">
          <div className="font-semibold text-neutral-950">
            Airport-first browsing
          </div>
          <p className="mt-1 text-xs leading-relaxed">
            Compare vehicle type, luggage space, transmission, and daily rate
            before starting your reservation.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 border-b border-neutral-100 pb-6">
        <VehicleCategoryFilter
          activeCategory={activeCategory}
          categoryCounts={categoryCounts}
        />
        <span className="text-xs text-neutral-500 font-semibold shrink-0 bg-neutral-50 border border-neutral-200/50 rounded-full px-4 py-1.5 shadow-sm">
          {availabilityLabel}
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

function createCategoryCounts(
  vehicles: { category: VehicleCategory | null }[],
): Record<VehicleCategory | "ALL", number> {
  const counts = {
    ALL: vehicles.length,
    SEDAN: 0,
    SUV: 0,
    LUXURY: 0,
    COMPACT: 0,
  };

  for (const vehicle of vehicles) {
    if (vehicle.category) {
      counts[vehicle.category] += 1;
    }
  }

  return counts;
}

function formatCategoryLabel(category: VehicleCategory, count: number): string {
  const label = category === "SUV" ? "SUV" : category.toLowerCase();
  return count === 1 ? `${label} vehicle` : `${label} vehicles`;
}
