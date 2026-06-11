"use client";

/**
 * StripeDepositPanel — client component for deposit payment confirmation.
 *
 * Architecture:
 * - Client-only (no SSR Stripe import). Loaded only when status=PENDING_DEPOSIT.
 * - Uses @stripe/react-stripe-js Elements provider + PaymentElement.
 * - stripeClientSecret is passed as prop — it is NOT stored anywhere persistent.
 * - Stripe JS loads lazily via getStripePromise() only when this component renders.
 * - return_url points back to the same confirmed page so the server component
 *   re-fetches the updated reservation status after Stripe redirects.
 *
 * Backend context (from backend/src/stripe/stripe.service.ts):
 * - PaymentIntent uses capture_method: "manual" — authorize only.
 * - Capture happens via backend webhook + BullMQ job after document approval.
 * - So stripe.confirmPayment() authorizes the deposit but does NOT charge it yet.
 * - The status after authorization will remain PENDING_DEPOSIT until the backend
 *   webhook processes and captures. The UI reflects this honestly.
 *
 * BYPASS_PAYMENT mode:
 * - If NEXT_PUBLIC_BYPASS_PAYMENT=true, show a clear demo bypass state.
 * - Never fake a paid state — always honest about bypass.
 *
 * Do NOT:
 * - Store stripeClientSecret in localStorage or sessionStorage.
 * - Load Stripe on any route other than this component's render boundary.
 * - Mark reservation as paid without backend confirmation.
 * - Show fake success immediately after confirmPayment.
 */

import { useState, useMemo, useId } from "react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { CreditCard, Lock, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { getStripePromise, isStripeConfigured } from "./stripe-client";
import type { DepositPanelState, PaymentError } from "./types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type StripeDepositPanelProps = {
  /** Stripe client secret from the backend reservation. NOT stored. */
  clientSecret: string;
  /** Backend reservation UUID for building the return_url. */
  reservationId: string;
  /** Deposit amount in EUR cents (for display). Backend is canonical. */
  depositEurCents: number;
  /** Total rental in EUR cents (for display context). */
  totalPriceEurCents: number;
};

// ---------------------------------------------------------------------------
// Amount formatter
// ---------------------------------------------------------------------------

function fmtEur(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}

// ---------------------------------------------------------------------------
// PaymentForm — inner component that uses Stripe hooks
// Must be inside <Elements> to access useStripe/useElements
// ---------------------------------------------------------------------------

type PaymentFormProps = {
  reservationId: string;
  depositEurCents: number;
  totalPriceEurCents: number;
};

function PaymentForm({
  reservationId,
  depositEurCents,
  totalPriceEurCents,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [state, setState] = useState<DepositPanelState>("idle");
  const [paymentError, setPaymentError] = useState<PaymentError | null>(null);

  const errorId = useId();
  const headingId = useId();

  const isSubmitting = state === "submitting";
  const isSubmitted = state === "submitted";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!stripe || !elements || isSubmitting || isSubmitted) return;

    setPaymentError(null);
    setState("submitting");

    try {
      // Step 1: Validate the Elements form fields
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setState("error");
        setPaymentError({
          message:
            submitError.message ??
            "Please check your card details and try again.",
          recoverable: true,
        });
        return;
      }

      // Step 2: Confirm the payment (authorize only — capture_method: manual)
      // return_url sends the user back to this same page so the server
      // re-fetches the updated reservation status from the backend.
      const returnUrl = `${window.location.origin}/reservations/${reservationId}/confirmed`;

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
        },
        // redirect: "if_required" handles 3DS without leaving the page
        // if possible; falls back to redirect when required.
        redirect: "if_required",
      });

      if (confirmError) {
        // confirmError.type === "card_error" | "validation_error" | "invalid_request_error"
        const isCardError =
          confirmError.type === "card_error" ||
          confirmError.type === "validation_error";

        setState("error");
        setPaymentError({
          message:
            confirmError.message ??
            "Payment could not be processed. Please try again.",
          recoverable: isCardError,
        });
        return;
      }

      // Payment authorization submitted without redirect (3DS not required).
      // Backend webhook will update status. Show honest "submitted" state.
      setState("submitted");
    } catch (err) {
      setState("error");
      setPaymentError({
        message:
          err instanceof Error
            ? err.message
            : "An unexpected error occurred. Please try again.",
        recoverable: true,
      });
    }
  }

  // -------------------------------------------------------------------------
  // Submitted state — authorization accepted, backend webhook pending
  // -------------------------------------------------------------------------

  if (isSubmitted) {
    return (
      <div
        className="space-y-4 rounded-lg border border-green-200 bg-green-50 p-6"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-3">
          <CheckCircle2
            aria-hidden="true"
            className="h-6 w-6 shrink-0 text-green-600"
          />
          <h3
            className="text-sm font-black text-green-950"
            id={headingId}
          >
            Payment authorized
          </h3>
        </div>
        <p className="text-sm leading-6 text-green-800">
          Your deposit has been authorized. We are processing your
          reservation — this typically takes a few seconds. Refresh this page
          to see the updated status.
        </p>
        <p className="text-xs text-green-700">
          No charge has been made yet. The deposit is only captured after your
          documents are verified by an operator.
        </p>
        <button
          className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-md bg-green-800 px-5 text-sm font-bold text-white transition hover:bg-green-900"
          onClick={() => window.location.reload()}
          type="button"
        >
          Refresh reservation status
        </button>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Payment form
  // -------------------------------------------------------------------------

  return (
    <form
      aria-describedby={paymentError ? errorId : undefined}
      aria-label="Deposit payment form"
      noValidate
      onSubmit={handleSubmit}
    >
      {/* Amounts context */}
      <div className="mb-5 rounded-md border border-[var(--nx-line)] bg-neutral-50 px-4 py-3">
        <div className="flex justify-between text-sm">
          <span className="text-neutral-600">Total rental (paid on return)</span>
          <span className="font-bold text-neutral-950">
            {fmtEur(totalPriceEurCents)}
          </span>
        </div>
        <div className="mt-1.5 flex justify-between text-sm">
          <span className="text-neutral-600">
            Security deposit <span className="text-neutral-400">(authorized now)</span>
          </span>
          <span className="font-black text-neutral-950">
            {fmtEur(depositEurCents)}
          </span>
        </div>
        <p className="mt-2 text-xs text-neutral-500">
          The deposit is authorized (not charged) and released after vehicle
          return in good condition.
        </p>
      </div>

      {/* Stripe Elements */}
      <div className="mb-5">
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
      </div>

      {/* Error display */}
      {paymentError && (
        <div
          className="mb-5 flex items-start gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3"
          id={errorId}
          role="alert"
        >
          <AlertTriangle
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0 text-red-600"
          />
          <div>
            <p className="text-sm font-bold text-red-900">Payment failed</p>
            <p className="mt-0.5 text-sm text-red-800">{paymentError.message}</p>
            {paymentError.recoverable && (
              <p className="mt-1 text-xs text-red-700">
                Please check your card details and try again.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-neutral-950 px-5 text-sm font-black text-white transition disabled:cursor-not-allowed disabled:opacity-60"
        disabled={!stripe || !elements || isSubmitting}
        type="submit"
      >
        {isSubmitting ? (
          <>
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            Processing…
          </>
        ) : (
          <>
            <Lock aria-hidden="true" className="h-4 w-4" />
            Authorize deposit — {fmtEur(depositEurCents)}
          </>
        )}
      </button>

      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-neutral-500">
        <Lock aria-hidden="true" className="h-3 w-3" />
        Secured by Stripe. Your card details are never stored on our servers.
      </p>
    </form>
  );
}

// ---------------------------------------------------------------------------
// StripeDepositPanel — outer Elements wrapper
// ---------------------------------------------------------------------------

export function StripeDepositPanel({
  clientSecret,
  reservationId,
  depositEurCents,
  totalPriceEurCents,
}: StripeDepositPanelProps) {
  // Memoize so loadStripe() is only called once even if parent re-renders
  const stripePromise = useMemo(() => getStripePromise(), []);

  // Config error: publishable key missing
  if (!isStripeConfigured()) {
    return (
      <div
        className="rounded-md border border-red-200 bg-red-50 px-4 py-4"
        role="alert"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0 text-red-600"
          />
          <div>
            <p className="text-sm font-bold text-red-900">
              Payment system not configured
            </p>
            <p className="mt-1 text-sm text-red-800">
              The Stripe publishable key is missing. Configure{" "}
              <code className="font-mono text-xs">
                NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
              </code>{" "}
              in your environment to enable payments.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Bypass mode — honest demo state, customer-safe presentation
  const isBypass = process.env.NEXT_PUBLIC_BYPASS_PAYMENT === "true";
  if (isBypass) {
    return (
      <div
        className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 space-y-4"
        role="status"
        aria-label="Demo checkout active"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
          />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-amber-950">
              Demo checkout active
            </p>
            <p className="text-xs text-amber-800 font-light leading-relaxed">
              Real Stripe payment is disabled in this environment. In production,
              this panel shows the secure Stripe payment form.
            </p>
          </div>
        </div>
        <a
          className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-neutral-950 px-5 text-xs font-semibold text-white transition hover:bg-neutral-800 shadow-sm"
          href={`/reservations/${reservationId}/check-in`}
        >
          Continue to document check-in
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--nx-line)] bg-white">
      {/* Panel header */}
      <div className="flex items-center gap-2 border-b border-[var(--nx-line)] px-6 py-4">
        <CreditCard
          aria-hidden="true"
          className="h-4 w-4 text-[var(--nx-accent)]"
        />
        <h2 className="text-sm font-black uppercase tracking-[0.14em] text-neutral-950">
          Authorize deposit
        </h2>
      </div>

      <div className="px-6 py-5">
        <p className="mb-5 text-sm leading-6 text-neutral-600">
          A refundable security deposit of{" "}
          <span className="font-bold text-neutral-950">
            {fmtEur(depositEurCents)}
          </span>{" "}
          is required to confirm your reservation. Your card will be
          authorized but{" "}
          <strong>not charged</strong> until your documents are verified.
        </p>

        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: "stripe",
              variables: {
                colorPrimary: "#0a0a0a",
                colorBackground: "#ffffff",
                colorText: "#171717",
                colorDanger: "#b91c1c",
                fontFamily: "Inter, system-ui, sans-serif",
                spacingUnit: "4px",
                borderRadius: "6px",
              },
            },
          }}
        >
          <PaymentForm
            depositEurCents={depositEurCents}
            reservationId={reservationId}
            totalPriceEurCents={totalPriceEurCents}
          />
        </Elements>
      </div>
    </div>
  );
}
