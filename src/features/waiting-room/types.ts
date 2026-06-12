/**
 * Waiting room feature types.
 *
 * Describes the normalized SSE event shapes from
 * GET /api/v1/sse/reservation/:id and the connection/display state.
 */

// ---------------------------------------------------------------------------
// Backend SSE event shapes (raw JSON from EventSource.data)
// ---------------------------------------------------------------------------

export type SsePingEvent = {
  type: "keepalive";
  updatedAt: string;
};

export type SseDocumentStatusEvent = {
  type: "reservation.document.updated";
  resourceId: string;
  status: string;
  updatedAt: string;
};

export type SseReservationStatusEvent = {
  type: "reservation.status.updated";
  resourceId: string;
  status: string;
  updatedAt: string;
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
  | "ready"            // All docs approved, ticket can be requested
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
