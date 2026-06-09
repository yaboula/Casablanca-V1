/**
 * stripe-client.ts — lazy Stripe initialization singleton.
 *
 * Rules:
 * - Stripe is loaded lazily via loadStripe() — NOT imported as a side effect.
 * - This module is safe to import in client components only.
 * - It must NOT be imported in server components, layouts, or public routes.
 * - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is the only env var used here.
 * - No secret keys are referenced or exposed.
 *
 * The singleton pattern ensures loadStripe() is only called once across
 * re-renders of the payment panel.
 */

import { loadStripe, type Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Returns the shared Stripe instance promise.
 *
 * Call this INSIDE the payment component, not at module-level,
 * to ensure Stripe is not loaded until the payment UI actually renders.
 *
 * Returns null if NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not configured,
 * allowing the payment panel to show a clear configuration error.
 */
export function getStripePromise(): Promise<Stripe | null> {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  if (!publishableKey) {
    // Return a resolved null — the payment component will render an error state.
    return Promise.resolve(null);
  }

  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey);
  }

  return stripePromise;
}

/**
 * Whether Stripe is configured with a publishable key.
 * Used to show configuration errors early.
 */
export function isStripeConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
}
