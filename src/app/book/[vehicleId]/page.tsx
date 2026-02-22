import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { mapApiVehicle } from "@/lib/api-mappers";
import type { Vehicle } from "@/types";
import BookFlowClient from "@/components/vehicles/BookFlowClient";
import { SERVER_API_BASE } from "@/lib/config";

const API_URL = SERVER_API_BASE;

// Allow any UUID
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
  if (!vehicle) return { title: "Reservar | NEXUS." };

  return {
    title: `Reservar ${vehicle.brand} ${vehicle.model} | NEXUS.`,
    description: `Completa tu reserva del ${vehicle.brand} ${vehicle.model} — solo ${10}€ de señal.`,
  };
}

// ── Page ──────────────────────────────────────────────────────

export default async function BookPage({ params }: Props) {
  const { vehicleId } = await params;
  const vehicle = await getVehicle(vehicleId);

  if (!vehicle) notFound();

  return <BookFlowClient vehicle={vehicle} />;
}
