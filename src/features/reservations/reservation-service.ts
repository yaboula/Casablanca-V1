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
  DepositStatus,
  ReservationApi,
  ReservationDetailApiResponse,
  ReservationPaymentIntentRecoveryApi,
  ReservationPaymentIntentRecoveryApiResponse,
  ReservationPaymentIntentRecoveryViewModel,
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

const DEPOSIT_STATUSES = new Set<string>([
  "PENDING",
  "CAPTURE_QUEUED",
  "CAPTURED",
  "FAILED",
  "CANCELLED",
]);

function asDepositStatus(value: unknown): DepositStatus | null {
  return typeof value === "string" && DEPOSIT_STATUSES.has(value)
    ? (value as DepositStatus)
    : null;
}

export async function getReservationPaymentIntentRecovery(
  reservationId: string,
): Promise<ReservationPaymentIntentRecoveryViewModel | null> {
  const response = await serverFetch<ReservationPaymentIntentRecoveryApiResponse>(
    `/reservations/${encodeURIComponent(reservationId)}/payment-intent`,
    { cache: "no-store" },
  );

  const raw =
    response.data && typeof response.data === "object"
      ? (response.data as ReservationPaymentIntentRecoveryApi)
      : null;

  if (!raw) {
    return null;
  }

  const reservationIdValue =
    typeof raw.reservationId === "string" && raw.reservationId.trim().length > 0
      ? raw.reservationId
      : null;
  const clientSecret =
    typeof raw.clientSecret === "string" && raw.clientSecret.trim().length > 0
      ? raw.clientSecret
      : null;
  const depositEurCents =
    typeof raw.depositEurCents === "number" ? raw.depositEurCents : null;
  const totalDueNowEurCents =
    typeof raw.totalDueNowEurCents === "number" ? raw.totalDueNowEurCents : null;
  const currency =
    typeof raw.currency === "string" && raw.currency.trim().length > 0
      ? raw.currency
      : null;
  const expiresAt =
    typeof raw.expiresAt === "string" &&
    !Number.isNaN(new Date(raw.expiresAt).getTime())
      ? new Date(raw.expiresAt).toISOString()
      : null;

  if (
    !reservationIdValue ||
    !clientSecret ||
    depositEurCents === null ||
    totalDueNowEurCents === null ||
    !currency
  ) {
    return null;
  }

  return {
    reservationId: reservationIdValue,
    clientSecret,
    depositEurCents,
    totalDueNowEurCents,
    currency,
    depositPaymentStatus: asDepositStatus(raw.depositPaymentStatus),
    expiresAt,
  };
}
