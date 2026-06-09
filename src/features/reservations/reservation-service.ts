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
