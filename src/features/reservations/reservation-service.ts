import "server-only";
/**
 * Reservation service — server-side data fetching.
 *
 * Uses serverFetch (HTTP-only cookies, no token exposure to browser JS).
 * Called only from Server Components and route handlers.
 *
 * Backend endpoints:
 *   GET /api/v1/reservations/:id → { data: Reservation }
 *     - USER: can only access own reservations (403 otherwise)
 *     - OPERATOR/ADMIN: can access any
 */

import { serverFetch } from "@/lib/api/server-fetch";
import { adaptReservation } from "./reservation-adapters";
import type {
  ReservationApi,
  ReservationDetailApiResponse,
  ReservationTicketApi,
  ReservationTicketApiResponse,
  ReservationTicketViewModel,
  ReservationViewModel,
} from "./types";

export async function getReservationDetail(
  reservationId: string,
): Promise<ReservationViewModel | null> {
  const response = await serverFetch<ReservationDetailApiResponse>(
    `/reservations/${encodeURIComponent(reservationId)}`,
    { cache: "no-store" },
  );

  const raw = response.data ?? {};
  return adaptReservation(raw as ReservationApi);
}

export async function getReservationTicket(
  reservationId: string,
): Promise<ReservationTicketViewModel | null> {
  const response = await serverFetch<ReservationTicketApiResponse>(
    `/reservations/${encodeURIComponent(reservationId)}/ticket`,
    { cache: "no-store" },
  );

  const raw =
    response.data && typeof response.data === "object"
      ? (response.data as ReservationTicketApi)
      : null;

  if (!raw) {
    return null;
  }

  const ticketToken =
    typeof raw.ticketToken === "string" && raw.ticketToken.trim().length > 0
      ? raw.ticketToken
      : null;
  const expiresAt =
    typeof raw.expiresAt === "string" && !Number.isNaN(new Date(raw.expiresAt).getTime())
      ? new Date(raw.expiresAt).toISOString()
      : null;

  if (!ticketToken || !expiresAt) {
    return null;
  }

  return { ticketToken, expiresAt };
}
