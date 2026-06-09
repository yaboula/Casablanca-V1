/**
 * Waiting room feature types.
 *
 * Describes the SSE event shapes from GET /api/v1/sse/reservation/:id
 * and the connection/display state for the waiting room.
 *
 * Backend SSE source: backend/src/sse/sse.service.ts
 *
 * SSE event types:
 *   "ping"                     — keepalive, ignore
 *   "DOCUMENT_STATUS_UPDATE"   — document approved/rejected
 *   "RESERVATION_STATUS_UPDATE"— reservation status changed
 */

// ---------------------------------------------------------------------------
// Backend SSE event shapes (raw JSON from EventSource.data)
// ---------------------------------------------------------------------------

export type SsePingEvent = {
  type: "ping";
  timestamp: number;
};

export type SseDocumentStatusEvent = {
  type: "DOCUMENT_STATUS_UPDATE";
  documentStatus: string;
  documentType: string | null;
  rejectionReason: string | null;
  reservationId: string;
  timestamp: number;
};

export type SseReservationStatusEvent = {
  type: "RESERVATION_STATUS_UPDATE";
  status: string;
  reservationId: string;
  timestamp: number;
  [key: string]: unknown;
};

export type SseRawEvent =
  | SsePingEvent
  | SseDocumentStatusEvent
  | SseReservationStatusEvent;

// ---------------------------------------------------------------------------
// SSE connection state
// ---------------------------------------------------------------------------

/**
 * Connection state reported to the UI.
 * "live"     — EventSource connected and receiving events
 * "degraded" — connection failed or reconnecting
 * "fallback" — too many SSE failures, using HTTP polling instead
 * "closed"   — terminal state reached or route left
 */
export type SseConnectionState = "live" | "degraded" | "fallback" | "closed";

// ---------------------------------------------------------------------------
// Waiting room view state
// ---------------------------------------------------------------------------

/**
 * The overall state of the waiting room view.
 * Derived from backend reservation + document truth, not from SSE alone.
 */
export type WaitingRoomPhase =
  | "loading"          // Initial data not yet available
  | "docs_pending"     // Documents submitted, awaiting operator review
  | "docs_rejected"    // One or more documents rejected
  | "ready"            // All docs approved, ticket data available
  | "confirmed"        // Reservation CONFIRMED (may or may not have ticket)
  | "in_progress"      // Rental in progress
  | "completed"        // Rental completed
  | "cancelled"        // Reservation cancelled
  | "awaiting_capture" // Payment processing
  | "error";           // Unrecoverable state

// ---------------------------------------------------------------------------
// Waiting room data
// ---------------------------------------------------------------------------

export type WaitingRoomData = {
  reservationId: string;
  phase: WaitingRoomPhase;
  connectionState: SseConnectionState;
};
