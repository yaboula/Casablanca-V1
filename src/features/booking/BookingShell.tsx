"use client";

/**
 * BookingShell — client-side orchestrator for the /book/[vehicleId] route.
 *
 * Responsibilities (Commit H):
 * - Manages submission state and idempotency key lifecycle.
 * - Calls createReservation() with the idempotency key.
 * - On success: clears key, redirects to /reservations/:id/confirmed.
 * - On 409: keeps key, shows conflict message with retry option.
 * - On 400/422: keeps key, surfaces backend validation errors.
 * - On 401: lets the session proxy handle it (user sees login redirect).
 * - Prevents double-submit while pending.
 */

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import type { VehicleDetailModel } from "@/features/catalog/types";
import { BookingForm } from "./BookingForm";
import { BookingSummary } from "./BookingSummary";
import {
  getOrCreateIdempotencyKey,
  clearIdempotencyKey,
} from "./idempotency";
import { createReservation } from "./booking-service";
import type { BookingFormSchema } from "./booking-schema";
import type { ReservationCreateDto, PickupLocation } from "./types";

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
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [tripDates, setTripDates] = useState<{
    pickup: string;
    returnDate: string;
    location: string;
  }>({
    pickup: "",
    returnDate: "",
    location: "",
  });

  const handleSubmitReady = useCallback(
    async (values: BookingFormSchema) => {
      // Prevent double-submit
      if (isSubmitting) return;

      setSubmitError(null);
      setIsSubmitting(true);

      // Update summary panel immediately with validated dates
      setTripDates({
        pickup: values.pickupDate,
        returnDate: values.returnDate,
        location: values.pickupLocation,
      });

      try {
        // Get or reuse the idempotency key — generates once, reuses on retry.
        // The key is bound to this vehicle UUID and expires in 24h.
        const idempotencyKey = getOrCreateIdempotencyKey(vehicle.id);

        // Map form values to the exact backend DTO shape.
        // Backend does NOT accept email or notes — only these fields.
        const dto: ReservationCreateDto = {
          vehicleId: vehicle.id,
          pickupDate: values.pickupDate,
          returnDate: values.returnDate,
          pickupLocation: values.pickupLocation as PickupLocation,
          customerName: values.driverName,
          customerPhone: values.driverPhone,
        };

        const result = await createReservation(dto, idempotencyKey);

        if (result.ok) {
          // Success: clear the idempotency key and redirect.
          // The stripeClientSecret in result.reservation is NOT stored here —
          // it will be fetched fresh from the confirmation page.
          clearIdempotencyKey();
          router.push(
            `/reservations/${result.reservation.id}/confirmed`,
          );
          return;
        }

        // ----------------------------------------------------------------
        // Error handling — idempotency key semantics:
        // 409 conflict: keep key (backend deduplicates, retrying is safe)
        // 400/422 validation: keep key (user fixes fields, retry is same intent)
        // 401: keep key (session refresh happens, user may retry)
        // 5xx/network: keep key (retry is safe with same key)
        // Unrecoverable: only clear if explicitly told to restart
        // ----------------------------------------------------------------
        const { error } = result;

        if (error.kind === "conflict") {
          // 409: A reservation with this idempotency key may already exist.
          // Do not generate a new key. Show a useful message.
          setSubmitError(
            "A reservation for this vehicle may already have been created. " +
              "Please check your dashboard, or contact support if you believe this is an error. " +
              "If you want to start over with a new booking, cancel and return to the fleet.",
          );
          return;
        }

        if (error.kind === "validation") {
          // 400/422: Backend validation rejected the request.
          // Show errors. Key is preserved for retry.
          const details = error.errors?.join(" ") ?? error.message;
          setSubmitError(
            `Booking details were not accepted: ${details}`,
          );
          return;
        }

        if (error.kind === "auth") {
          // 401: Session may have expired. The session proxy should handle this.
          setSubmitError(
            "Your session has expired. Please refresh the page and sign in again.",
          );
          return;
        }

        if (error.kind === "not-found") {
          // Vehicle was removed or UUID is invalid.
          setSubmitError(
            "This vehicle is no longer available. Please return to the fleet and choose another.",
          );
          return;
        }

        // Generic server/network error — safe to retry
        setSubmitError(
          error.message ||
            "The reservation could not be created. Please try again.",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [vehicle.id, isSubmitting, router],
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
          Enter your trip dates, terminal, and contact details. Your
          reservation is confirmed by the backend — no fake references are
          generated here.
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
          pickupLocation={tripDates.location}
          returnDate={tripDates.returnDate}
          vehicle={vehicle}
        />
      </div>

      {/* Next step context */}
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
            <span>Upload your licence and documents before arrival.</span>
          </li>
        </ol>
      </div>
    </section>
  );
}
