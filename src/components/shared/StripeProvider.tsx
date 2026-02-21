"use client";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import type { ReactNode } from "react";

// Load Stripe once at module level (singleton)
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""
);

interface StripeProviderProps {
  children: ReactNode;
  clientSecret: string;
}

/**
 * Wraps children in Stripe Elements with the given PaymentIntent clientSecret.
 * Must be used inside a Client Component that has received the secret
 * from the backend (POST /api/v1/reservations).
 */
export default function StripeProvider({
  children,
  clientSecret,
}: StripeProviderProps) {
  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#2563eb",
            borderRadius: "12px",
            fontFamily: "inherit",
          },
        },
      }}
    >
      {children}
    </Elements>
  );
}
