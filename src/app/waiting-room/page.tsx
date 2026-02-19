import type { Metadata } from "next";
import WaitingRoomClient from "@/components/customer/WaitingRoomClient";

export const metadata: Metadata = {
  title: "Verificacion · NEXUS.",
  description: "Tus documentos estan siendo verificados por nuestro equipo.",
};

interface Props {
  searchParams: Promise<{ reservationId?: string }>;
}

export default async function WaitingRoomPage({ searchParams }: Props) {
  const { reservationId } = await searchParams;
  return <WaitingRoomClient reservationId={reservationId ?? "CMN-2026-001"} />;
}