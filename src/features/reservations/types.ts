/**
 * Reservation feature types.
 *
 * These types represent backend-owned state for existing reservations.
 * Sources of truth:
 * - backend/src/reservations/reservation.entity.ts
 * - backend/src/reservations/reservations.controller.ts (GET /reservations/:id)
 *
 * All status values and financial fields come from the backend.
 * The frontend must never transition status or compute totals itself.
 */

// ---------------------------------------------------------------------------
// Backend API response types (raw DTO shape)
// ---------------------------------------------------------------------------

/**
 * Raw reservation object returned by the backend (after JSON serialization).
 * Dates are ISO strings. All financial fields are in EUR cents.
 */
export type ReservationApi = {
  id?: unknown;
  status?: unknown;
  pickupDate?: unknown;
  returnDate?: unknown;
  totalDays?: unknown;
  totalPriceEurCents?: unknown;
  depositEurCents?: unknown;
  pickupLocation?: unknown;
  stripeClientSecret?: unknown;
  stripePaymentIntentId?: unknown;
  qrCodeHash?: unknown;
  customerName?: unknown;
  customerPhone?: unknown;
  userId?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  vehicle?: unknown;
};

export type ReservationDetailApiResponse = {
  data?: unknown;
};

// ---------------------------------------------------------------------------
// Backend-driven status machine
// ---------------------------------------------------------------------------

export type ReservationStatus =
  | "PENDING_DEPOSIT"
  | "AWAITING_CAPTURE"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type PickupLocation = "CMN_T1" | "CMN_T2";

// ---------------------------------------------------------------------------
// Embedded vehicle (eager-loaded in reservation response)
// ---------------------------------------------------------------------------

export type ReservationVehicleModel = {
  id: string;
  name: string;
  imageUrl: string | null;
  pricePerDayEurCents: number | null;
  category: string | null;
};

// ---------------------------------------------------------------------------
// View model — plain JSON, safe to cross server→client boundary
// ---------------------------------------------------------------------------

/**
 * Reservation view model passed to UI components.
 *
 * Rules:
 * - All fields are plain JSON (strings, numbers, null). No Date objects.
 * - Financial fields are in EUR cents. Display helpers convert to EUR.
 * - stripeClientSecret is included so the confirmation page can pass it to
 *   Stripe Elements (Commit I). It must NOT be stored in localStorage.
 * - qrCodeHash is NOT exposed in the UI yet (smart ticket is Commit K+).
 * - Status text is derived from the backend status value, not invented.
 */
export type ReservationViewModel = {
  id: string;
  status: ReservationStatus;
  /** ISO date string, e.g. "2026-07-15T00:00:00.000Z" */
  pickupDate: string;
  /** ISO date string */
  returnDate: string;
  totalDays: number;
  /** Backend-computed total in EUR cents */
  totalPriceEurCents: number;
  /** Deposit in EUR cents (typically 1000 = 10 EUR) */
  depositEurCents: number;
  pickupLocation: PickupLocation | null;
  /**
   * Transient Stripe client secret — use only to mount Stripe Elements.
   * Do not log, store in localStorage, or expose beyond payment component.
   * Will be null if payment was already captured or PI was not created.
   */
  stripeClientSecret: string | null;
  /** null until reservation is CONFIRMED */
  hasQrCode: boolean;
  customerName: string | null;
  customerPhone: string | null;
  vehicle: ReservationVehicleModel | null;
  createdAt: string;
};
