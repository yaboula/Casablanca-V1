"use client";

/**
 * BookingShell - client-side orchestrator for the /book/[vehicleId] route.
 *
 * Responsibilities:
 * - Manages submission state and idempotency key lifecycle.
 * - Calls createReservation() with the idempotency key.
 * - On success: clears key, redirects to /reservations/:id/confirmed.
 * - Keeps backend as the source of truth for reservation, payment, and totals.
 */

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import type { VehicleDetailModel } from "@/features/catalog/types";
import { BookingForm } from "./BookingForm";
import { BookingSummary } from "./BookingSummary";
import {
  clearIdempotencyKey,
  getOrCreateIdempotencyKey,
} from "./idempotency";
import { createReservation } from "./booking-service";
import { rememberPaymentClientSecret } from "@/features/payments/payment-client-secret-cache";
import type { BookingFormSchema } from "./booking-schema";
import type { PickupLocation, ReservationCreateDto } from "./types";
import { useQuote } from "./use-quote";

const JOURNEY_STEPS = [
  { key: "reserve", label: "Reserve" },
  { key: "verify", label: "Verify" },
  { key: "pickup", label: "Pickup" },
] as const;

type JourneyStep = (typeof JOURNEY_STEPS)[number]["key"];

function JourneyProgress({ currentStep }: { currentStep: JourneyStep }) {
  const currentIndex = JOURNEY_STEPS.findIndex((step) => step.key === currentStep);

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

type BookingShellProps = {
  vehicle: VehicleDetailModel;
};

export function BookingShell({ vehicle }: BookingShellProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [tripDates, setTripDates] = useState({
    pickup: "",
    returnDate: "",
    location: "",
  });

  const { quote, isLoading: isQuoteLoading, error: quoteError } = useQuote(
    vehicle.id,
    tripDates.pickup,
    tripDates.returnDate,
    tripDates.location
  );

  const isSubmitDisabled =
    !tripDates.pickup ||
    !tripDates.returnDate ||
    !tripDates.location ||
    isQuoteLoading ||
    !!quoteError ||
    (quote ? !quote.available : true);

  const handleDraftChange = useCallback(
    (values: {
      pickupDate: string;
      returnDate: string;
      pickupLocation?: string;
    }) => {
      setTripDates({
        pickup: values.pickupDate,
        returnDate: values.returnDate,
        location: values.pickupLocation ?? "",
      });
    },
    [],
  );

  const handleSubmitReady = useCallback(
    async (values: BookingFormSchema) => {
      if (isSubmitting || isSubmitDisabled) return;

      setSubmitError(null);
      setIsSubmitting(true);

      setTripDates({
        pickup: values.pickupDate,
        returnDate: values.returnDate,
        location: values.pickupLocation,
      });

      try {
        const idempotencyKey = getOrCreateIdempotencyKey(vehicle.id);
        const dto: ReservationCreateDto = {
          vehicleId: vehicle.id,
          pickupAt: values.pickupDate,
          returnAt: values.returnDate,
          pickupLocation: values.pickupLocation as PickupLocation,
          customerName: values.driverName,
          customerPhone: values.driverPhone,
        };

        const result = await createReservation(dto, idempotencyKey);

        if (result.ok) {
          clearIdempotencyKey();
          rememberPaymentClientSecret(
            result.reservation.id,
            result.reservation.stripeClientSecret,
          );
          router.push(`/reservations/${result.reservation.id}/confirmed`);
          return;
        }

        const { error } = result;

        if (error.kind === "conflict") {
          setSubmitError(
            "A reservation for this vehicle may already have been created. Please check your dashboard, or contact support if you believe this is an error.",
          );
          return;
        }

        if (error.kind === "validation") {
          const details = error.errors?.join(" ") ?? error.message;
          setSubmitError(`Booking details were not accepted: ${details}`);
          return;
        }

        if (error.kind === "auth") {
          setSubmitError(
            "Your session has expired. Please refresh the page and sign in again.",
          );
          return;
        }

        if (error.kind === "not-found") {
          setSubmitError(
            "This vehicle is no longer available. Please return to the fleet and choose another.",
          );
          return;
        }

        setSubmitError(
          error.message ||
            "The reservation could not be created. Please try again.",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [vehicle.id, isSubmitting, isSubmitDisabled, router],
  );

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-10 md:py-14">
      <div className="mb-8 max-w-2xl">
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-neutral-500">
          Step 1 of 3
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-normal text-neutral-950">
          Complete your reservation.
        </h1>
        <p className="mt-3 text-base leading-7 text-neutral-700">
          Set your dates, choose your CMN terminal, and confirm the driver
          details before secure payment.
        </p>
      </div>

      <JourneyProgress currentStep="reserve" />

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div className="rounded-[1.25rem] border border-[var(--nx-line)] bg-white p-6 md:p-8">
          <BookingForm
            isSubmitting={isSubmitting}
            isSubmitDisabled={isSubmitDisabled}
            onDraftChange={handleDraftChange}
            onSubmitReady={handleSubmitReady}
            pricePerDayEurCents={vehicle.pricePerDayEurCents}
            quote={quote}
            submitError={submitError}
            vehicleId={vehicle.id}
          />
        </div>

        <BookingSummary
          pickupDate={tripDates.pickup}
          pickupLocation={tripDates.location}
          returnDate={tripDates.returnDate}
          vehicle={vehicle}
          quote={quote}
          isQuoteLoading={isQuoteLoading}
          quoteError={quoteError}
        />
      </div>

      <div className="mt-8 rounded-[1.25rem] border border-[var(--nx-line)] bg-[var(--nx-bg-soft)] p-5">
        <h2 className="text-sm font-black text-neutral-950">
          What happens after you submit
        </h2>
        <ol className="mt-3 grid gap-2 text-sm leading-6 text-neutral-700 sm:grid-cols-3">
          <li className="flex items-start gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-xs font-black text-white">
              1
            </span>
            <span>
              We create your reservation and prepare secure payment
              authorization.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-xs font-black text-white">
              2
            </span>
            <span>
              You review the final total and authorize the refundable deposit.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-xs font-black text-white">
              3
            </span>
            <span>
              Upload your license and passport before arrival so pickup stays
              fast.
            </span>
          </li>
        </ol>
      </div>
    </section>
  );
}
