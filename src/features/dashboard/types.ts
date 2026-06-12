/**
 * Dashboard feature types.
 *
 * GET /api/v1/reservations/my returns a paginated response.
 * Backend: backend/src/reservations/reservations.controller.ts (GET /my)
 */

import type {
  ReservationViewModel,
  ReservationApi,
} from "@/features/reservations/types";
import { canAccessCustomerTicket } from "@/features/reservations/reservation-helpers";

// ---------------------------------------------------------------------------
// Backend API response shape for GET /reservations/my
// ---------------------------------------------------------------------------

export type ReservationListApiResponse = {
  data?: unknown[];
  total?: number;
  page?: number;
  limit?: number;
};

// ---------------------------------------------------------------------------
// Dashboard view model
// ---------------------------------------------------------------------------

export type DashboardData = {
  reservations: ReservationViewModel[];
  total: number;
};

// ---------------------------------------------------------------------------
// Next action — derived from reservation status only (no doc fetch)
// ---------------------------------------------------------------------------

export type ReservationNextAction =
  | "complete_payment"   // PENDING_DEPOSIT
  | "payment_processing" // AWAITING_CAPTURE
  | "upload_documents"   // CONFIRMED — docs needed
  | "await_review"       // CONFIRMED — docs submitted
  | "view_ticket"        // CONFIRMED + captured deposit
  | "active"             // IN_PROGRESS
  | "completed"          // COMPLETED
  | "cancelled";         // CANCELLED

export function deriveNextAction(
  reservation: ReservationViewModel,
): ReservationNextAction {
  switch (reservation.status) {
    case "PENDING_DEPOSIT":
      return "complete_payment";
    case "AWAITING_CAPTURE":
      return "payment_processing";
    case "CONFIRMED":
      if (canAccessCustomerTicket(reservation)) return "view_ticket";
      return "upload_documents";
    case "IN_PROGRESS":
      return "active";
    case "COMPLETED":
      return "completed";
    case "CANCELLED":
      return "cancelled";
    default:
      return "upload_documents";
  }
}

export type { ReservationApi };
