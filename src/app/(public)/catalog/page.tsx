import type { Metadata } from "next";
import { ApiError } from "@/lib/api/errors";
import {
  CatalogEmptyState,
  CatalogErrorState,
} from "@/features/catalog/CatalogStates";
import { formatCategory } from "@/features/catalog/format-price";
import { VehicleCategoryFilter } from "@/features/catalog/VehicleCategoryFilter";
import { getVehicleCatalog } from "@/features/catalog/vehicle-service";
import { VehicleGrid } from "@/features/catalog/VehicleGrid";
import type { VehicleCategory } from "@/features/catalog/types";
import { VEHICLE_CATEGORIES } from "@/features/catalog/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catalogue",
  description:
    "Catalogue public de vehicules connecte au backend Casablanca V1.",
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
      <section className="mx-auto w-full max-w-7xl px-6 py-12 md:py-16">
        <CatalogHeader activeCategory={activeCategory} vehicleCount={0} />
        <CatalogErrorState message={message} />
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-12 md:py-16">
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
    <div className="mb-9 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
      <div className="max-w-3xl space-y-5">
        <p className="text-sm font-bold text-neutral-500">
          Casablanca Mohammed V Airport fleet
        </p>
        <h1 className="text-balance text-4xl font-black tracking-normal text-neutral-950 md:text-6xl">
          Choose the exact vehicle.
        </h1>
        <p className="max-w-2xl text-base leading-7 text-neutral-700 md:text-lg">
          Public catalog data comes from `GET /api/v1/vehicles`. Prices are
          displayed from backend EUR cents, and public cards do not expose
          admin-only fields.
        </p>
      </div>
      <div className="rounded-lg border border-[var(--nx-line)] bg-[var(--nx-bg-soft)] p-5">
        <p className="text-sm font-black text-neutral-950">
          {vehicleCount} {vehicleCount === 1 ? "vehicle" : "vehicles"}
        </p>
        <p className="mt-1 text-sm text-neutral-600">
          {activeCategory
            ? `${formatCategory(activeCategory)} filter`
            : "All backend categories"}
        </p>
      </div>
      <div className="lg:col-span-2">
        <VehicleCategoryFilter activeCategory={activeCategory} />
      </div>
    </div>
  );
}

function parseCategory(category: string | undefined): VehicleCategory | null {
  return VEHICLE_CATEGORIES.includes(category as VehicleCategory)
    ? (category as VehicleCategory)
    : null;
}
