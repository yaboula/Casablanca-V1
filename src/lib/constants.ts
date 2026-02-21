// ============================================================
// Application-wide constants
// These will move to environment variables when the backend is ready
// ============================================================

/** WhatsApp number of the on-site operator (with country code) */
export const OPERATOR_WHATSAPP = process.env.NEXT_PUBLIC_OPERATOR_WHATSAPP ?? "212600000000";

/** Deposit amount charged via Stripe at reservation time */
export const DEPOSIT_AMOUNT_EUR = 10;

/** EUR → MAD conversion rate (update periodically) */
export const EUR_TO_MAD_RATE = 10.8;

/** How often the waiting-room polls document status (ms) */
export const DOCUMENT_POLLING_INTERVAL_MS = 30_000;

/** Days ahead shown in the DualTimelineSlider */
export const TIMELINE_DAYS_AHEAD = 30;

/** Operator phone for pre-filled WhatsApp messages */
export const OPERATOR_PHONE = process.env.NEXT_PUBLIC_OPERATOR_PHONE ?? "212600000000";

/** Pickup location display names */
export const PICKUP_LOCATION_LABELS: Record<string, string> = {
  CMN_T1: "CMN · Terminal 1",
  CMN_T2: "CMN · Terminal 2",
};

// ── Vehicle catalog ──────────────────────────────────────────

/** Category display labels */
export const CATEGORY_LABELS: Record<string, string> = {
  ALL: "Todos",
  SEDAN: "Sedán",
  SUV: "SUV",
  LUXURY: "Lujo",
  COMPACT: "Compacto",
};

/** Vehicle categories in display order */
export const CATEGORIES = ["ALL", "SEDAN", "SUV", "LUXURY", "COMPACT"] as const;

/**
 * Generates stable pseudo-random occupancy heat values for a vehicle.
 * Seeded from the vehicleId string so the same vehicle always renders
 * the same heat bar — no React hydration mismatch.
 */
export function getOccupancyHeat(vehicleId: string | undefined | null): number[] {
  if (!vehicleId) return Array(7).fill(0.3);
  let seed = 0;
  for (let i = 0; i < vehicleId.length; i++) seed += vehicleId.charCodeAt(i);
  return Array.from({ length: 7 }, (_, i) => {
    const x = Math.sin(seed * (i + 1)) * 10_000;
    return Math.abs(x - Math.floor(x));
  });
}
