/**
 * Booking feature types.
 *
 * Sources of truth:
 * - backend/src/reservations/dto/create-reservation.dto.ts — DTO shape
 * - backend/src/reservations/reservation.entity.ts — response entity
 *
 * The following are NEVER stored in the draft or faked in the UI:
 * - Reservation UUID
 * - Payment state / stripeClientSecret
 * - Backend-computed price totals (totalPriceEurCents, depositEurCents)
 */

// ---------------------------------------------------------------------------
// Pickup location — mirrors backend PickupLocation enum
// ---------------------------------------------------------------------------

export type PickupLocation = "CMN_T1" | "CMN_T2";

export const PICKUP_LOCATIONS: { value: PickupLocation; label: string }[] = [
  { value: "CMN_T1", label: "Terminal 1 (CMN T1)" },
  { value: "CMN_T2", label: "Terminal 2 (CMN T2)" },
];

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
  /** Airport terminal — maps to PickupLocation enum */
  pickupLocation: PickupLocation;
  /** Full name of the driver/primary contact — maps to customerName */
  driverName: string;
  /** Contact phone — maps to customerPhone */
  driverPhone: string;
};

// ---------------------------------------------------------------------------
// Backend DTO — exact shape sent to POST /api/v1/reservations
// ---------------------------------------------------------------------------

/**
 * Exact DTO fields expected by POST /api/v1/reservations.
 *
 * Source: backend/src/reservations/dto/create-reservation.dto.ts
 *
 * IMPORTANT: Backend intentionally does NOT accept totalPriceEurCents.
 * Price is recalculated server-side (security: prevent price tampering).
 * Do not add any pricing fields here.
 */
export type ReservationCreateDto = {
  vehicleId: string;
  /** Preferred backend datetime field. ISO 8601 date-time string. */
  pickupAt: string;
  /** Preferred backend datetime field. ISO 8601 date-time string. */
  returnAt: string;
  /** ISO 8601 date string, e.g. "2026-07-15" */
  pickupDate?: string;
  /** ISO 8601 date string, e.g. "2026-07-20" */
  returnDate?: string;
  /** Airport pickup terminal */
  pickupLocation: PickupLocation;
  /** Optional — driver/customer full name */
  customerName?: string;
  /** Optional — phone number, backend validates format */
  customerPhone?: string;
};

// ---------------------------------------------------------------------------
// Backend reservation status machine — read-only in UI
// ---------------------------------------------------------------------------

/**
 * Source: backend/src/reservations/reservation.entity.ts — ReservationStatus enum
 * These values are returned by GET /api/v1/reservations/:id and must not be
 * faked, invented, or transitioned by the frontend.
 */
export type ReservationStatus =
  | "PENDING_DEPOSIT"
  | "AWAITING_CAPTURE"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

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
  pickupLocation: PickupLocation;
  driverName: string;
  driverPhone: string;
};

// ---------------------------------------------------------------------------
// Quote View Model & DTO
// ---------------------------------------------------------------------------

export type QuoteReservationDto = {
  vehicleId: string;
  pickupAt: string;
  returnAt: string;
  pickupLocation: PickupLocation;
};

export type ExtraBillingType = "NONE" | "GRACE" | "HALF_DAY" | "FULL_DAY";

export type PricingQuote = {
  dailyRateEurCents: number;
  fullDays: number;
  extraHours: number;
  extraBillingType: ExtraBillingType;
  chargedDayUnitsX2: number;
  chargedDayUnits: string;
  subtotalEurCents: number;
  estimatedTotalEurCents: number;
  depositEurCents: number;
  totalDueNowEurCents: number;
  currency: string;
  pricingPolicyVersion: string;
};

export type QuoteViewModel = {
  available: boolean;
  pricing: PricingQuote;
  policy: {
    graceHours: number;
    halfDayUntilHours: number;
    pricingPolicyVersion: string;
  };
};
