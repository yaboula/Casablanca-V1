import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/auth/route-guards";
import { getReservationDetail } from "@/features/reservations/reservation-service";
import { getReservationDocuments } from "@/features/documents/document-service";
import { DocumentCheckInView } from "@/features/documents/DocumentCheckInView";
import { ApiError } from "@/lib/api/errors";
import { getDefaultRouteForRole } from "@/features/auth/auth-redirects";

type CheckInPageProps = {
  params: Promise<{
    reservationId: string;
  }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: CheckInPageProps): Promise<Metadata> {
  const { reservationId } = await params;
  return {
    title: "Document Check-in — Nexus Mobility",
    description: `Upload your documents for reservation ${reservationId} at Casablanca Mohammed V Airport.`,
  };
}

export default async function CheckInPage({ params }: CheckInPageProps) {
  const { reservationId } = await params;

  // Auth required — unauthenticated users redirected to login with return path.
  const user = await requireAuthenticatedUser(
    `/reservations/${reservationId}/check-in`,
  );

  if (user.role !== "USER") {
    redirect(getDefaultRouteForRole(user.role));
  }

  let reservation;
  let documents;

  try {
    // Fetch reservation and documents in parallel
    [reservation, documents] = await Promise.all([
      getReservationDetail(reservationId),
      getReservationDocuments(reservationId),
    ]);
  } catch (error) {
    if (error instanceof ApiError) {
      if (
        error.payload.kind === "not-found" ||
        // 403 → notFound() to prevent reservation enumeration
        error.payload.kind === "forbidden"
      ) {
        notFound();
      }
    }
    // Server errors bubble to error.tsx boundary
    throw error;
  }

  if (!reservation) {
    notFound();
  }

  return (
    <DocumentCheckInView
      initialDocuments={documents}
      reservation={reservation}
    />
  );
}
