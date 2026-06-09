/**
 * Smart ticket feature types.
 *
 * Uses reservation detail only — no /tickets endpoint exists.
 * QR data comes from backend qrCodeHash field on the reservation.
 * If qrCodeHash is absent, ticket is not ready — show honest state.
 */

export type TicketReadyState =
  | "ready"       // qrCodeHash is present and reservation is confirmed
  | "not_ready"   // qrCodeHash is missing or reservation not in confirmable state
  | "cancelled";  // Reservation was cancelled
