import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/auth/route-guards";
import { getDefaultRouteForRole } from "@/features/auth/auth-redirects";
import {
  getReservationDetail,
  getReservationTicket,
} from "@/features/reservations/reservation-service";
import { SmartTicketView } from "@/features/smart-ticket/SmartTicketView";
import { ApiError } from "@/lib/api/errors";
import type { TicketReadyState } from "@/features/smart-ticket/types";

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

  const user = await requireAuthenticatedUser(
    `/reservations/${reservationId}/ticket`,
  );

  if (user.role !== "USER") {
    redirect(getDefaultRouteForRole(user.role));
  }

  let reservation;
  let ticket = null;
  let ticketState: TicketReadyState | undefined;

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

  try {
    ticket = await getReservationTicket(reservationId);
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.payload.kind === "forbidden" || error.payload.kind === "not-found") {
        notFound();
      }

      if (error.payload.kind === "conflict") {
        const message = error.payload.message.toLowerCase();

        if (message.includes("revoc")) {
          ticketState = "revoked";
        } else if (message.includes("expir")) {
          ticketState = "expired";
        } else if (reservation.status === "CANCELLED") {
          ticketState = "cancelled";
        } else {
          ticketState = "not_ready";
        }
      } else {
        throw error;
      }
    } else {
      throw error;
    }
  }

  if (
    !ticket &&
    !ticketState &&
    reservation.status === "CONFIRMED" &&
    reservation.depositStatus === "CAPTURED"
  ) {
    ticketState = "not_ready";
  }

  return (
    <SmartTicketView
      reservation={reservation}
      ticket={ticket}
      ticketState={ticketState}
    />
  );
}
