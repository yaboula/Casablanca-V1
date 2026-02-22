import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { mapApiVehicle } from "@/lib/api-mappers";
import type { Vehicle } from "@/types";
import VehicleDetailClient from "@/components/vehicles/VehicleDetailClient";
import { SERVER_API_BASE } from "@/lib/config";

const API_URL = SERVER_API_BASE;

// Allow any UUID — do not pre-render with static params
export const dynamicParams = true;

// ── Data fetcher ──────────────────────────────────────────────

async function getVehicle(id: string): Promise<Vehicle | null> {
  try {
    const res = await fetch(`${API_URL}/vehicles/${id}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const raw = json.data ?? json;
    return mapApiVehicle(raw);
  } catch {
    return null;
  }
}

// ── Metadata ──────────────────────────────────────────────────

type Props = { params: Promise<{ vehicleId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { vehicleId } = await params;
  const vehicle = await getVehicle(vehicleId);
  if (!vehicle) return { title: "Vehículo no encontrado | NEXUS." };

  return {
    title: `${vehicle.brand} ${vehicle.model} — ${vehicle.pricePerDay}€/día | NEXUS.`,
    description: `Alquila un ${vehicle.brand} ${vehicle.model} desde ${vehicle.pricePerDay}€/día en el Aeropuerto Mohammed V. Entrega en terminal, seguro incluido.`,
  };
}

// ── Page ──────────────────────────────────────────────────────

export default async function VehicleDetailPage({ params }: Props) {
  const { vehicleId } = await params;
  const vehicle = await getVehicle(vehicleId);

  if (!vehicle) notFound();

  return <VehicleDetailClient vehicle={vehicle} />;
}
