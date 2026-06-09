/**
 * Payment feature types.
 *
 * These types are internal to the payment feature module.
 * No backend-owned payment state is invented or faked here.
 * All payment truth comes from the backend reservation object.
 */

// ---------------------------------------------------------------------------
// Payment panel state
// ---------------------------------------------------------------------------

/**
 * The possible UI states of the deposit payment panel.
 *
 * - idle: Stripe Elements mounted, user has not submitted
 * - submitting: stripe.confirmPayment() in progress
 * - submitted: Stripe has accepted the authorization (backend webhook pending)
 * - error: recoverable error (card declined, network, etc.)
 * - config-error: missing publishable key or client secret (not recoverable)
 */
export type DepositPanelState =
  | "idle"
  | "submitting"
  | "submitted"
  | "error"
  | "config-error";

// ---------------------------------------------------------------------------
// Payment error
// ---------------------------------------------------------------------------

/**
 * Normalized payment error for display.
 * Stripe errors are user-safe — we display them as-is.
 */
export type PaymentError = {
  /** User-facing message (Stripe-provided or normalized) */
  message: string;
  /** Whether user can retry the same payment */
  recoverable: boolean;
};
