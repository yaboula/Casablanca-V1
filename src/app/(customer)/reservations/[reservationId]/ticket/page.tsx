import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/auth/route-guards";
import { getReservationDetail } from "@/features/reservations/reservation-service";
import { SmartTicketView } from "@/features/smart-ticket/SmartTicketView";
import { ApiError } from "@/lib/api/errors";

type TicketPageProps = {
  params: Promise<{
    reservationId: string;
  }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: TicketPageProps): Promise<Metadata> {
  const { reservationId } = await params;
  return {
    title: "Smart Ticket — Nexus Mobility",
    description: `Your rental ticket for reservation ${reservationId}.`,
  };
}

export default async function TicketPage({ params }: TicketPageProps) {
  const { reservationId } = await params;

  await requireAuthenticatedUser(
    `/reservations/${reservationId}/ticket`,
  );

  let reservation;

  try {
    reservation = await getReservationDetail(reservationId);
  } catch (error) {
    if (error instanceof ApiError) {
      if (
        error.payload.kind === "not-found" ||
        error.payload.kind === "forbidden"
      ) {
        notFound();
      }
    }
    throw error;
  }

  if (!reservation) {
    notFound();
  }

  return <SmartTicketView reservation={reservation} />;
}
