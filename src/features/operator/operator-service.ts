import "server-only";
/**
 * Operator service — server-side fetching for operator routes.
 *
 * Fetches from:
 *   GET /api/v1/operator/deliveries?date=
 *   GET /api/v1/operator/deliveries/stats?date=
 *   GET /api/v1/operator/documents/pending
 *
 * All calls use serverFetch (HTTP-only cookie auth).
 * Called only from Server Components.
 *
 * Security:
 * - Backend enforces OPERATOR/ADMIN role guard on all /operator/* routes.
 * - Frontend role check is an additional UX gate only.
 */

import { serverFetch } from "@/lib/api/server-fetch";
import {
  adaptDeliveries,
  adaptDeliveryStats,
  adaptPendingDocuments,
} from "./operator-adapters";
import type {
  DeliveryViewModel,
  DeliveryStats,
  PendingDocumentViewModel,
  DeliveryListApiResponse,
  DeliveryStatsApiResponse,
  PendingDocumentsApiResponse,
} from "./types";

// ---------------------------------------------------------------------------
// Deliveries
// ---------------------------------------------------------------------------

export async function getDeliveries(
  date?: string,
): Promise<DeliveryViewModel[]> {
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  const response = await serverFetch<DeliveryListApiResponse>(
    `/operator/deliveries${query}`,
    { cache: "no-store" },
  );
  return adaptDeliveries(response);
}

export async function getDeliveryDetail(
  reservationId: string,
): Promise<DeliveryViewModel | null> {
  // Since there's no single detail endpoint for operator deliveries, we fetch
  // today's deliveries and find the match. If it's for a different date, the
  // operator can't scan it yet anyway per business rules (deliveries are daily).
  // We can pass a wide date range if needed, but the current backend
  // GET /operator/deliveries endpoint returns today by default.
  // We'll fetch today's list since handoffs happen on the pickup date.
  const deliveries = await getDeliveries();
  const match = deliveries.find((d) => d.id === reservationId);
  return match ?? null;
}

// ---------------------------------------------------------------------------
// Delivery stats
// ---------------------------------------------------------------------------

export async function getDeliveryStats(date?: string): Promise<DeliveryStats> {
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  const response = await serverFetch<DeliveryStatsApiResponse>(
    `/operator/deliveries/stats${query}`,
    { cache: "no-store" },
  );
  return adaptDeliveryStats(response);
}

// ---------------------------------------------------------------------------
// Pending documents
// ---------------------------------------------------------------------------

export async function getPendingDocuments(): Promise<
  PendingDocumentViewModel[]
> {
  const response = await serverFetch<PendingDocumentsApiResponse>(
    `/operator/documents/pending`,
    { cache: "no-store" },
  );
  return adaptPendingDocuments(response);
}
