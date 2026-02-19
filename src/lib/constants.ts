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
