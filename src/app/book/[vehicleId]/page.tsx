import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MOCK_VEHICLES } from "@/lib/mock-data";
import BookFlowClient from "@/components/vehicles/BookFlowClient";

// ── Metadata ──────────────────────────────────────────────────

type Props = { params: Promise<{ vehicleId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { vehicleId } = await params;
  const vehicle = MOCK_VEHICLES.find((v) => v.id === vehicleId);
  if (!vehicle)
    return { title: "Reservar | NEXUS." };

  return {
    title: `Reservar ${vehicle.brand} ${vehicle.model} | NEXUS.`,
    description: `Completa tu reserva del ${vehicle.brand} ${vehicle.model} — solo ${10}€ de señal.`,
  };
}

// ── Static params ─────────────────────────────────────────────

export function generateStaticParams() {
  return MOCK_VEHICLES.map((v) => ({ vehicleId: v.id }));
}

// ── Page ──────────────────────────────────────────────────────

export default async function BookPage({ params }: Props) {
  const { vehicleId } = await params;
  const vehicle = MOCK_VEHICLES.find((v) => v.id === vehicleId);

  if (!vehicle) notFound();

  return <BookFlowClient vehicle={vehicle} />;
}
