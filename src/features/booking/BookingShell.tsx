"use client";

/**
 * BookingShell — client-side orchestrator for the /book/[vehicleId] route.
 *
 * Responsibilities:
 * - Manages local booking state (form values, submission state, error).
 * - Manages idempotency key lifecycle.
 * - Renders BookingForm + BookingSummary side by side.
 * - Provides the progress indicator for Reserve → Verify → Pickup.
 *
 * What this component does NOT do (deferred to Commit H):
 * - Does not call POST /api/v1/reservations.
 * - Does not redirect to confirmation/payment.
 * - Does not store or display fake reservation data.
 *
 * The onSubmitReady handler is the wired extension point for Commit H.
 */

import { useState, useCallback } from "react";
import { CheckCircle2 } from "lucide-react";
import type { VehicleDetailModel } from "@/features/catalog/types";
import { BookingForm } from "./BookingForm";
import { BookingSummary } from "./BookingSummary";
import { getOrCreateIdempotencyKey } from "./idempotency";
import type { BookingFormSchema } from "./booking-schema";

// ---------------------------------------------------------------------------
// Journey progress indicator
// ---------------------------------------------------------------------------

const JOURNEY_STEPS = [
  { key: "reserve", label: "Reserve" },
  { key: "verify", label: "Verify" },
  { key: "pickup", label: "Pickup" },
] as const;

type JourneyStep = (typeof JOURNEY_STEPS)[number]["key"];

function JourneyProgress({ currentStep }: { currentStep: JourneyStep }) {
  const currentIndex = JOURNEY_STEPS.findIndex((s) => s.key === currentStep);

  return (
    <nav aria-label="Booking progress" className="mb-8">
      <ol className="flex items-center gap-0">
        {JOURNEY_STEPS.map((step, index) => {
          const isDone = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <li key={step.key} className="flex items-center">
              <div className="flex items-center gap-2">
                <span
                  aria-current={isCurrent ? "step" : undefined}
                  className={[
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-black",
                    isDone
                      ? "bg-[var(--nx-accent)] text-white"
                      : isCurrent
                        ? "bg-neutral-950 text-white"
                        : "border-2 border-[var(--nx-line)] bg-white text-neutral-400",
                  ].join(" ")}
                >
                  {isDone ? (
                    <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                  ) : (
                    <span aria-hidden="true">{index + 1}</span>
                  )}
                </span>
                <span
                  className={[
                    "text-sm font-bold",
                    isCurrent ? "text-neutral-950" : "text-neutral-400",
                  ].join(" ")}
                >
                  {step.label}
                </span>
              </div>
              {index < JOURNEY_STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className="mx-3 h-px w-8 bg-[var(--nx-line)] sm:w-12"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// BookingShell
// ---------------------------------------------------------------------------

type BookingShellProps = {
  vehicle: VehicleDetailModel;
};

export function BookingShell({ vehicle }: BookingShellProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [tripDates, setTripDates] = useState({ pickup: "", returnDate: "" });

  /**
   * Called by BookingForm with validated values.
   *
   * In Commit G this is the wiring point — it generates/retrieves the
   * idempotency key and logs the intent, but does NOT call the backend.
   * Commit H will replace the TODO with the real POST /api/v1/reservations call.
   */
  const handleSubmitReady = useCallback(
    async (values: BookingFormSchema) => {
      setSubmitError(null);
      setIsSubmitting(true);

      try {
        // Ensure idempotency key is ready before the backend call.
        // Generates once, reuses on retry for the same vehicle.
        // The key is stored in sessionStorage; Commit H reads it via
        // getOrCreateIdempotencyKey() when calling POST /api/v1/reservations.
        void getOrCreateIdempotencyKey(vehicle.id);

        // TODO (Commit H): Call POST /api/v1/reservations with:
        //   - body: ReservationCreateDto mapped from `values`
        //   - header: "Idempotency-Key": _idempotencyKey
        // On success: clear idempotency key, redirect to /reservations/:id/confirmed
        // On conflict (409): reuse key, show backend error message
        // On validation (400/422): show field errors, do NOT clear key

        // Commit G boundary: we do not call the backend here.
        // Show a clear boundary message so the UI is honest.
        setSubmitError(
          "Reservation creation will be wired in the next phase. " +
            "Your trip details are validated and ready.",
        );

        // Keep the validated dates for the summary display.
        setTripDates({ pickup: values.pickupDate, returnDate: values.returnDate });
      } finally {
        setIsSubmitting(false);
      }
    },
    [vehicle.id],
  );

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-10 md:py-14">
      {/* Page header */}
      <div className="mb-8 max-w-2xl">
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-neutral-500">
          Step 1 of 3
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-normal text-neutral-950">
          Complete your reservation.
        </h1>
        <p className="mt-3 text-base leading-7 text-neutral-700">
          Enter your trip dates and contact details. Your reservation is created
          and confirmed by the backend — no fake references are generated here.
        </p>
      </div>

      {/* Journey progress */}
      <JourneyProgress currentStep="reserve" />

      {/* Main layout: form + summary */}
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        {/* Form */}
        <div className="rounded-lg border border-[var(--nx-line)] bg-white p-6 md:p-8">
          <BookingForm
            isSubmitting={isSubmitting}
            onSubmitReady={handleSubmitReady}
            submitError={submitError}
            vehicleId={vehicle.id}
          />
        </div>

        {/* Summary panel */}
        <BookingSummary
          pickupDate={tripDates.pickup}
          returnDate={tripDates.returnDate}
          vehicle={vehicle}
        />
      </div>

      {/* Next step context — honest boundary */}
      <div className="mt-8 rounded-lg border border-[var(--nx-line)] bg-[var(--nx-bg-soft)] p-5">
        <h2 className="text-sm font-black text-neutral-950">
          What happens after you submit
        </h2>
        <ol className="mt-3 grid gap-2 text-sm leading-6 text-neutral-700 sm:grid-cols-3">
          <li className="flex items-start gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-xs font-black text-white">
              1
            </span>
            <span>
              Backend creates a reservation and a Stripe PaymentIntent.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-xs font-black text-white">
              2
            </span>
            <span>You confirm payment on the next screen.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-xs font-black text-white">
              3
            </span>
            <span>
              Upload your licence and documents before arrival.
            </span>
          </li>
        </ol>
      </div>
    </section>
  );
}
