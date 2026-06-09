import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/auth/route-guards";
import { getReservationDetail } from "@/features/reservations/reservation-service";
import { getReservationDocuments } from "@/features/documents/document-service";
import { WaitingRoomView } from "@/features/waiting-room/WaitingRoomView";
import { ApiError } from "@/lib/api/errors";

type WaitingPageProps = {
  params: Promise<{
    reservationId: string;
  }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: WaitingPageProps): Promise<Metadata> {
  const { reservationId } = await params;
  return {
    title: "Waiting Room — Nexus Mobility",
    description: `Track document review status for reservation ${reservationId}.`,
  };
}

export default async function WaitingPage({ params }: WaitingPageProps) {
  const { reservationId } = await params;

  await requireAuthenticatedUser(
    `/reservations/${reservationId}/waiting`,
  );

  let reservation;
  let documents;

  try {
    [reservation, documents] = await Promise.all([
      getReservationDetail(reservationId),
      getReservationDocuments(reservationId),
    ]);
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

  return (
    <WaitingRoomView
      initialDocuments={documents}
      reservation={reservation}
    />
  );
}
