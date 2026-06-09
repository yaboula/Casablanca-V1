"use client";

/**
 * BookingForm — trip details and driver contact form.
 *
 * Fields map to the real backend CreateReservationDto:
 *   vehicleId (from route) → passed via onSubmitReady
 *   pickupDate → required ISO date
 *   returnDate → required ISO date, must be after pickup
 *   pickupLocation → required enum (CMN_T1 | CMN_T2)
 *   customerName → maps to driverName (required in UI, optional in DTO)
 *   customerPhone → maps to driverPhone (required in UI, optional in DTO)
 */

import { useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, MapPin, User } from "lucide-react";
import {
  bookingFormSchema,
  type BookingFormSchema,
  type BookingFormInput,
} from "./booking-schema";
import { PICKUP_LOCATIONS } from "./types";

export type BookingFormProps = {
  vehicleId: string;
  /** Called with validated form values when the user submits. */
  onSubmitReady: (values: BookingFormSchema) => void | Promise<void>;
  /** External submission state (e.g. from parent doing the API call) */
  isSubmitting?: boolean;
  /** Backend-returned error after attempted reservation creation */
  submitError?: string | null;
};

type FieldProps = {
  label: string;
  id: string;
  errorId?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
};

function Field({ label, id, errorId, error, hint, children }: FieldProps) {
  return (
    <div className="grid gap-2">
      <label className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500" htmlFor={id}>
        {label}
      </label>
      {hint && <p className="text-xs text-neutral-400 font-light">{hint}</p>}
      {children}
      {error && (
        <p className="text-xs text-red-600 font-medium" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function SectionHeading({
  icon: Icon,
  title,
}: {
  icon: typeof CalendarDays;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2.5 border-b border-neutral-100 pb-3">
      <span className="w-8 h-8 rounded-lg bg-neutral-50 border border-neutral-200/60 flex items-center justify-center text-[#1E41FC] shadow-sm">
        <Icon aria-hidden="true" className="h-4 w-4" />
      </span>
      <h2 className="text-[10px] font-semibold uppercase tracking-widest text-neutral-800">
        {title}
      </h2>
    </div>
  );
}

const inputBase =
  "w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-sm text-neutral-900 outline-none transition-all duration-300 focus:border-[#1E41FC] focus:ring-2 focus:ring-[#1E41FC]/10 aria-invalid:border-red-500";

function todayIso(): string {
  return new Date().toISOString().split("T")[0];
}

export function BookingForm({
  onSubmitReady,
  isSubmitting = false,
  submitError = null,
}: BookingFormProps) {
  const formErrorId = useId();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BookingFormInput, unknown, BookingFormSchema>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      pickupDate: "",
      returnDate: "",
      pickupLocation: undefined,
      driverName: "",
      driverPhone: "",
    },
  });

  const pickupDate = watch("pickupDate");

  const pickupDateId = useId();
  const returnDateId = useId();
  const pickupLocationId = useId();
  const driverNameId = useId();
  const driverPhoneId = useId();

  const pickupDateErrorId = useId();
  const returnDateErrorId = useId();
  const pickupLocationErrorId = useId();
  const driverNameErrorId = useId();
  const driverPhoneErrorId = useId();

  async function onSubmit(values: BookingFormSchema) {
    await onSubmitReady(values);
  }

  return (
    <form
      aria-describedby={submitError ? formErrorId : undefined}
      className="grid gap-7"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
    >
      {/* Trip Dates */}
      <section aria-labelledby="trip-dates-heading" className="grid gap-4 bg-white border border-neutral-200 p-5 rounded-2xl shadow-sm">
        <SectionHeading icon={CalendarDays} title="Trip dates" />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            error={errors.pickupDate?.message}
            errorId={pickupDateErrorId}
            id={pickupDateId}
            label="Pickup date"
          >
            <input
              {...register("pickupDate")}
              aria-describedby={
                errors.pickupDate ? pickupDateErrorId : undefined
              }
              aria-invalid={!!errors.pickupDate}
              autoComplete="off"
              className={inputBase}
              id={pickupDateId}
              min={todayIso()}
              type="date"
            />
          </Field>

          <Field
            error={errors.returnDate?.message}
            errorId={returnDateErrorId}
            id={returnDateId}
            label="Return date"
          >
            <input
              {...register("returnDate")}
              aria-describedby={
                errors.returnDate ? returnDateErrorId : undefined
              }
              aria-invalid={!!errors.returnDate}
              autoComplete="off"
              className={inputBase}
              id={returnDateId}
              min={pickupDate || todayIso()}
              type="date"
            />
          </Field>
        </div>
      </section>

      {/* Pickup Location */}
      <section aria-labelledby="pickup-location-heading" className="grid gap-4 bg-white border border-neutral-200 p-5 rounded-2xl shadow-sm">
        <SectionHeading icon={MapPin} title="Pickup terminal" />
        <Field
          error={errors.pickupLocation?.message}
          errorId={pickupLocationErrorId}
          hint="Vehicles are delivered at Casablanca Mohammed V Airport (CMN)."
          id={pickupLocationId}
          label="Airport terminal"
        >
          <select
            {...register("pickupLocation")}
            aria-describedby={
              errors.pickupLocation ? pickupLocationErrorId : undefined
            }
            aria-invalid={!!errors.pickupLocation}
            className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-sm text-neutral-900 outline-none transition-all duration-300 focus:border-[#1E41FC] focus:ring-2 focus:ring-[#1E41FC]/10 aria-invalid:border-red-500 cursor-pointer"
            id={pickupLocationId}
          >
            <option value="">Select terminal…</option>
            {PICKUP_LOCATIONS.map((loc) => (
              <option key={loc.value} value={loc.value}>
                {loc.label}
              </option>
            ))}
          </select>
        </Field>
      </section>

      {/* Driver Information */}
      <section aria-labelledby="driver-info-heading" className="grid gap-4 bg-white border border-neutral-200 p-5 rounded-2xl shadow-sm">
        <SectionHeading icon={User} title="Driver information" />

        <Field
          error={errors.driverName?.message}
          errorId={driverNameErrorId}
          hint="Name matching your driving license exactly."
          id={driverNameId}
          label="Full name"
        >
          <input
            {...register("driverName")}
            aria-describedby={
              errors.driverName ? driverNameErrorId : undefined
            }
            aria-invalid={!!errors.driverName}
            autoComplete="name"
            className={inputBase}
            id={driverNameId}
            type="text"
          />
        </Field>

        <Field
          error={errors.driverPhone?.message}
          errorId={driverPhoneErrorId}
          id={driverPhoneId}
          label="Phone number"
        >
          <input
            {...register("driverPhone")}
            aria-describedby={
              errors.driverPhone ? driverPhoneErrorId : undefined
            }
            aria-invalid={!!errors.driverPhone}
            autoComplete="tel"
            className={inputBase}
            id={driverPhoneId}
            inputMode="tel"
            placeholder="+212 6XX XXX XXX"
            type="tel"
          />
        </Field>
      </section>

      {/* Submit Error */}
      {submitError && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-900"
          id={formErrorId}
          role="alert"
        >
          <p className="font-bold">Reservation could not be created.</p>
          <p className="mt-1 font-light">{submitError}</p>
        </div>
      )}

      {/* Submit CTA */}
      <div className="border-t border-neutral-100 pt-6 space-y-3">
        <button
          className="nx-btn-primary inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white transition-colors duration-300 hover:bg-[#1E41FC] disabled:cursor-not-allowed disabled:opacity-60 shadow-sm"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Creating reservation…" : "Review and create reservation"}
        </button>
        <p className="text-[10px] leading-relaxed text-neutral-400 font-light">
          Submitting your details creates a pending reservation in our system and prepares your Stripe Checkout link. No charges are applied until you authorize the security deposit on the next page.
        </p>
      </div>
    </form>
  );
}
