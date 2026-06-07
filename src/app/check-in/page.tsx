import type { Metadata } from "next";
import CheckInFlow from "@/components/customer/CheckInFlow";

export const metadata: Metadata = {
  title: "Check-in de Seguridad | NEXUS.",
  description:
    "Sube tu pasaporte y carnet de conducir para verificar tu identidad antes de recoger el vehículo.",
};

interface Props {
  searchParams: Promise<{ reservationId?: string; retryType?: string }>;
}

export default async function CheckInPage({ searchParams }: Props) {
  const { reservationId, retryType } = await searchParams;

  return (
    <CheckInFlow
      reservationId={reservationId ?? null}
      retryType={retryType ?? null}
    />
  );
}
