"use client";

/**
 * PaymentPanelLoader — thin client component boundary for the Stripe panel.
 *
 * This client wrapper exists because `ssr: false` in next/dynamic is only
 * allowed inside Client Components. ConfirmationView is a Server Component
 * and cannot use `ssr: false` dynamic imports directly.
 *
 * Architecture:
 * - This file is "use client" — it owns the client boundary for Stripe.
 * - It dynamically imports StripeDepositPanel with ssr: false.
 * - Stripe JS loads ONLY when this component mounts (payment state only).
 * - Public routes (/, /catalog, /catalog/:id) never import this file.
 */

import dynamic from "next/dynamic";
import { Loader2, AlertTriangle } from "lucide-react";

const StripeDepositPanel = dynamic(
  () =>
    import("./StripeDepositPanel").then((mod) => mod.StripeDepositPanel),
  {
    loading: () => (
      <div
        aria-label="Loading payment form"
        aria-live="polite"
        className="rounded-lg border border-[var(--nx-line)] bg-white"
      >
        <div className="flex animate-pulse items-center gap-2 border-b border-[var(--nx-line)] px-6 py-4">
          <div className="h-4 w-4 rounded bg-neutral-200" />
          <div className="h-4 w-32 rounded bg-neutral-200" />
        </div>
        <div className="animate-pulse space-y-4 px-6 py-5">
          <div className="h-4 w-full rounded bg-neutral-100" />
          <div className="h-32 w-full rounded bg-neutral-100" />
          <div className="h-12 w-full rounded bg-neutral-200" />
        </div>
        <div className="flex items-center justify-center gap-2 px-6 pb-4 text-xs text-neutral-400">
          <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
          Loading payment form…
        </div>
      </div>
    ),
    ssr: false,
  },
);

type PaymentPanelLoaderProps = {
  clientSecret: string | null;
  reservationId: string;
  depositEurCents: number;
  totalPriceEurCents: number;
};

export function PaymentPanelLoader({
  clientSecret,
  reservationId,
  depositEurCents,
  totalPriceEurCents,
}: PaymentPanelLoaderProps) {
  if (!clientSecret) {
    return (
      <div
        className="rounded-lg border border-red-200 bg-red-50 p-5"
        role="alert"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0 text-red-600"
          />
          <div>
            <p className="text-sm font-black text-red-950">
              Payment setup unavailable
            </p>
            <p className="mt-2 text-sm leading-6 text-red-800">
              Your reservation was created but the payment setup could not be
              completed at this time. This is a temporary issue — your booking
              is not lost.
            </p>
            <p className="mt-2 text-xs text-red-700">
              Please refresh this page or contact support with your reservation
              reference.
            </p>
            <button
              className="mt-4 inline-flex min-h-11 items-center rounded-md bg-red-800 px-5 text-sm font-bold text-white transition hover:bg-red-900"
              onClick={() => window.location.reload()}
              type="button"
            >
              Refresh page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <StripeDepositPanel
      clientSecret={clientSecret}
      depositEurCents={depositEurCents}
      reservationId={reservationId}
      totalPriceEurCents={totalPriceEurCents}
    />
  );
}
