import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/auth/route-guards";
import {
  getReservationDetail,
  getReservationPaymentIntentRecovery,
} from "@/features/reservations/reservation-service";
import { ConfirmationView } from "@/features/reservations/ConfirmationView";
import { ApiError } from "@/lib/api/errors";
import { getDefaultRouteForRole } from "@/features/auth/auth-redirects";

type ConfirmedPageProps = {
  params: Promise<{
    reservationId: string;
  }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: ConfirmedPageProps): Promise<Metadata> {
  const { reservationId } = await params;

  try {
    const reservation = await getReservationDetail(reservationId);

    if (!reservation) {
      return { title: "Reservation not found" };
    }

    const statusText =
      reservation.status === "PENDING_DEPOSIT"
        ? "Awaiting payment"
        : reservation.status === "CONFIRMED"
          ? "Confirmed"
          : reservation.status;

    return {
      title: `Reservation ${statusText} — Nexus Mobility`,
      description: `Your vehicle reservation at Casablanca Mohammed V Airport. Reference: ${reservation.id}`,
    };
  } catch {
    return { title: "Reservation — Nexus Mobility" };
  }
}

export default async function ConfirmedPage({ params }: ConfirmedPageProps) {
  const { reservationId } = await params;

  // Auth required — unauthenticated users redirected to login with return path.
  const user = await requireAuthenticatedUser(
    `/reservations/${reservationId}/confirmed`,
  );

  if (user.role !== "USER") {
    redirect(getDefaultRouteForRole(user.role));
  }

  let reservation;
  let paymentRecovery = null;

  try {
    reservation = await getReservationDetail(reservationId);
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.payload.kind === "not-found") {
        notFound();
      }
      if (error.payload.kind === "forbidden") {
        // User is trying to access another user's reservation.
        // notFound() is preferred over exposing 403 to prevent enumeration.
        notFound();
      }
    }
    // Network/server errors bubble to error.tsx boundary
    throw error;
  }

  if (!reservation) {
    notFound();
  }

  if (reservation.status === "PENDING_DEPOSIT") {
    try {
      paymentRecovery = await getReservationPaymentIntentRecovery(reservation.id);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.payload.kind !== "conflict") {
          throw error;
        }
      } else {
        throw error;
      }
    }
  }

  return (
    <ConfirmationView
      reservation={reservation}
      paymentRecovery={paymentRecovery}
    />
  );
}
