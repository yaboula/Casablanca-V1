import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MOCK_VEHICLES } from "@/lib/mock-data";
import VehicleDetailClient from "@/components/vehicles/VehicleDetailClient";

// ── Metadata ──────────────────────────────────────────────────

type Props = { params: Promise<{ vehicleId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { vehicleId } = await params;
  const vehicle = MOCK_VEHICLES.find((v) => v.id === vehicleId);
  if (!vehicle)
    return { title: "Vehículo no encontrado | NEXUS." };

  return {
    title: `${vehicle.brand} ${vehicle.model} — ${vehicle.pricePerDay}€/día | NEXUS.`,
    description: `Alquila un ${vehicle.brand} ${vehicle.model} desde ${vehicle.pricePerDay}€/día en el Aeropuerto Mohammed V. Entrega en terminal, seguro incluido.`,
  };
}

// ── Static params for pre-rendering ───────────────────────────

export function generateStaticParams() {
  return MOCK_VEHICLES.map((v) => ({ vehicleId: v.id }));
}

// ── Page ──────────────────────────────────────────────────────

export default async function VehicleDetailPage({ params }: Props) {
  const { vehicleId } = await params;
  const vehicle = MOCK_VEHICLES.find((v) => v.id === vehicleId);

  if (!vehicle) notFound();

  return <VehicleDetailClient vehicle={vehicle} />;
}
