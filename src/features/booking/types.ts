/**
 * Booking feature types.
 *
 * Separation of concerns:
 * - BookingDraft: user-entered, frontend-owned temporary state only.
 * - ReservationCreateDto: the exact shape sent to POST /api/v1/reservations.
 * - ReservationStatus: backend-owned status machine values, read-only in UI.
 *
 * The following are NEVER stored in the draft or faked in the UI:
 * - Reservation UUID
 * - Payment state
 * - Backend-computed total
 */

// ---------------------------------------------------------------------------
// Draft model — frontend-owned temporary state
// ---------------------------------------------------------------------------

/**
 * All fields are user-entered. Prices and vehicle details come from the
 * backend vehicle model and are displayed read-only, never stored as truth here.
 */
export type BookingDraft = {
  /** Backend UUID of the selected vehicle. Must be revalidated before create. */
  vehicleId: string;
  /** ISO 8601 date string for pickup (YYYY-MM-DD) */
  pickupDate: string;
  /** ISO 8601 date string for return (YYYY-MM-DD) */
  returnDate: string;
  /** Full name of the driver/primary contact */
  driverName: string;
  /** Contact email — used by backend to send confirmation */
  driverEmail: string;
  /** Contact phone — E.164 recommended; backend validates */
  driverPhone: string;
  /** Optional free-text notes if backend DTO supports it */
  notes: string;
};

// ---------------------------------------------------------------------------
// Backend DTO — what gets sent to POST /api/v1/reservations
// ---------------------------------------------------------------------------

/**
 * Exact DTO shape expected by POST /api/v1/reservations.
 * Backend owns totals, reservation UUID, and payment intent creation.
 * Do not add computed fields here; backend derives them from vehicle + dates.
 */
export type ReservationCreateDto = {
  vehicleId: string;
  startDate: string; // ISO date YYYY-MM-DD
  endDate: string; // ISO date YYYY-MM-DD
  driverName: string;
  driverEmail: string;
  driverPhone: string;
  notes?: string;
};

// ---------------------------------------------------------------------------
// Backend reservation status machine — read-only in UI
// ---------------------------------------------------------------------------

export type ReservationStatus =
  | "PENDING_PAYMENT"
  | "PENDING_DOCUMENTS"
  | "UNDER_REVIEW"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED";

// ---------------------------------------------------------------------------
// Idempotency key storage record
// ---------------------------------------------------------------------------

export type IdempotencyRecord = {
  key: string;
  vehicleId: string;
  createdAt: number; // Unix ms timestamp
  expiresAt: number; // Unix ms timestamp
};

// ---------------------------------------------------------------------------
// Booking form field values (matches Zod schema output)
// ---------------------------------------------------------------------------

export type BookingFormValues = {
  pickupDate: string;
  returnDate: string;
  driverName: string;
  driverEmail: string;
  driverPhone: string;
  notes: string;
};
