import type { Metadata } from "next";
import SmartTicketClient from "@/components/customer/SmartTicketClient";

export const metadata: Metadata = {
  title: "Smart Ticket · NEXUS.",
  description: "Tu pase de recogida aprobado - muestra el QR al operario.",
};

interface Props {
  searchParams: Promise<{ reservationId?: string }>;
}

export default async function SmartTicketPage({ searchParams }: Props) {
  const { reservationId } = await searchParams;
  return <SmartTicketClient reservationId={reservationId ?? "CMN-2026-001"} />;
}