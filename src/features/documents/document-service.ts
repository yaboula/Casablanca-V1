import "server-only";
/**
 * document-service.ts — server-side document data fetching.
 *
 * Uses serverFetch (HTTP-only cookies, no token exposure to browser JS).
 * Only called from Server Components and route handlers.
 *
 * Backend endpoints:
 *   GET /api/v1/documents/:reservationId → { data: documents[] }
 *     - USER: own reservations only (403 otherwise)
 *     - OPERATOR/ADMIN: any reservation
 */

import { serverFetch } from "@/lib/api/server-fetch";
import { adaptDocuments } from "./document-adapters";
import type { DocumentsListApiResponse, DocumentViewModel } from "./types";

export async function getReservationDocuments(
  reservationId: string,
): Promise<DocumentViewModel[]> {
  const response = await serverFetch<DocumentsListApiResponse>(
    `/documents/${encodeURIComponent(reservationId)}`,
    { cache: "no-store" },
  );

  return adaptDocuments(response.data ?? []);
}
