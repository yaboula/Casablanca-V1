import "server-only";
/**
 * Dashboard service — server-side fetching of GET /reservations/my.
 *
 * Uses serverFetch (HTTP-only cookies). Only called from Server Components.
 *
 * Backend: GET /api/v1/reservations/my?page=1&limit=20
 *   USER: returns caller's reservations
 *   OPERATOR/ADMIN: returns all reservations
 */

import { serverFetch } from "@/lib/api/server-fetch";
import { adaptDashboardData } from "./dashboard-adapters";
import type { DashboardData, ReservationListApiResponse } from "./types";

export async function getDashboardData(
  page = 1,
  limit = 20,
): Promise<DashboardData> {
  const response = await serverFetch<ReservationListApiResponse>(
    `/reservations/my?page=${page}&limit=${limit}`,
    { cache: "no-store" },
  );

  return adaptDashboardData(response);
}
