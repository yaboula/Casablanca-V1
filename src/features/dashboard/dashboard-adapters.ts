/**
 * Dashboard adapters — maps GET /reservations/my response to DashboardData.
 *
 * Uses the same adaptReservation adapter from reservation-adapters.ts.
 * Invalid records are skipped defensively.
 */

import { adaptReservation } from "@/features/reservations/reservation-adapters";
import type { ReservationApi, ReservationViewModel } from "@/features/reservations/types";
import type { DashboardData, ReservationListApiResponse } from "./types";

export function adaptDashboardData(
  raw: ReservationListApiResponse,
): DashboardData {
  const items = Array.isArray(raw.data) ? raw.data : [];
  const total = typeof raw.total === "number" ? raw.total : items.length;

  const reservations: ReservationViewModel[] = items
    .map((item) => adaptReservation(item as ReservationApi))
    .filter((r): r is ReservationViewModel => r !== null);

  return { reservations, total };
}
