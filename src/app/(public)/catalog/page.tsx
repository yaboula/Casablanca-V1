import type { Metadata } from "next";
import { ApiError } from "@/lib/api/errors";
import { CatalogEmptyState, CatalogErrorState } from "@/features/catalog/CatalogStates";
import { getVehicleCatalog } from "@/features/catalog/vehicle-service";
import { VehicleGrid } from "@/features/catalog/VehicleGrid";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catalogue",
  description:
    "Catalogue public de vehicules connecte au backend Casablanca V1.",
};

export default async function CatalogPage() {
  let vehicles;

  try {
    vehicles = await getVehicleCatalog();
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.payload.message
        : "Le backend catalogue n'a pas pu etre joint.";

    return (
      <section className="mx-auto w-full max-w-6xl px-6 py-12 md:py-16">
        <CatalogHeader />
        <CatalogErrorState message={message} />
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-12 md:py-16">
      <CatalogHeader />
      {vehicles.length > 0 ? (
        <VehicleGrid vehicles={vehicles} />
      ) : (
        <CatalogEmptyState />
      )}
    </section>
  );
}

function CatalogHeader() {
  return (
    <div className="mb-8 max-w-3xl space-y-4">
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-neutral-500">
        Backend vehicle contract
      </p>
      <h1 className="text-4xl font-black tracking-normal text-neutral-950 md:text-5xl">
        Catalogue vehicules
      </h1>
      <p className="text-base leading-7 text-neutral-700">
        Cette page lit exclusivement `GET /api/v1/vehicles` via la couche API
        Next. Les prix affiches proviennent du backend en centimes EUR.
      </p>
    </div>
  );
}
