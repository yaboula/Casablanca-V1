import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CatalogGrid from "@/components/vehicles/CatalogGrid";
import CatalogHeaderClient from "@/components/vehicles/CatalogHeaderClient";
import { mapApiVehicle } from "@/lib/api-mappers";
import type { Vehicle } from "@/types";

export const metadata: Metadata = {
  title: "Catálogo de Coches | NEXUS. — Alquiler en CMN",
  description:
    "Explora nuestra flota premium disponible en el Aeropuerto Mohammed V (CMN). SUV, sedán, lujo y compactos. Reserva por solo 10€.",
};

const API_URL = process.env.API_URL ?? "http://localhost:3900/api/v1";

interface SearchParams {
  pickupDate?: string;
  returnDate?: string;
  category?: string;
}

async function getVehicles(params: SearchParams): Promise<Vehicle[]> {
  const qs = new URLSearchParams();
  if (params.pickupDate) qs.set("pickupDate", params.pickupDate);
  if (params.returnDate) qs.set("returnDate", params.returnDate);
  if (params.category && params.category !== "ALL") qs.set("category", params.category);

  const url = `${API_URL}/vehicles${qs.toString() ? `?${qs}` : ""}`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data ?? []).map(mapApiVehicle);
  } catch {
    return [];
  }
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { pickupDate, returnDate, category } = await searchParams;
  const vehicles = await getVehicles({ pickupDate, returnDate, category });

  return (
    <main className="min-h-screen bg-brand-bg">
      {/* Hero banner */}
      <CatalogHeaderClient />

      <CatalogGrid
        vehicles={vehicles}
        pickupDate={pickupDate ?? null}
        returnDate={returnDate ?? null}
      />
    </main>
  );
}
