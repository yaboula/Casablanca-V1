/**
 * Smart ticket feature types.
 *
 * Uses the backend-owned ticket token issued by
 * GET /api/v1/reservations/:id/ticket.
 */

export type TicketReadyState =
  | "ready"
  | "not_ready"
  | "expired"
  | "revoked"
  | "cancelled";
