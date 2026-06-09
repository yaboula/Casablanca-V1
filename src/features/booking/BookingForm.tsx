"use client";

/**
 * BookingForm — trip details and driver contact form.
 *
 * Uses react-hook-form + zod for client-side validation.
 * Follows the same accessible form pattern as LoginForm/RegisterForm.
 *
 * What this form does NOT do:
 * - Does not call POST /api/v1/reservations (that is Commit H).
 * - Does not store or display fake reservation data.
 * - Does not generate or display fake payment state.
 * - Does not hold backend-owned totals as truth.
 *
 * The onSubmitReady callback receives validated BookingFormValues and is
 * the extension point for Commit H (reservation creation).
 */

import { useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, User } from "lucide-react";
import { bookingFormSchema, type BookingFormSchema, type BookingFormInput } from "./booking-schema";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BookingFormProps = {
  vehicleId: string;
  /** Called with validated form values when the user submits. */
  onSubmitReady: (values: BookingFormSchema) => void | Promise<void>;
  /** External submission state (e.g. from parent doing the API call) */
  isSubmitting?: boolean;
  /** Backend-returned error after attempted reservation creation */
  submitError?: string | null;
};

// ---------------------------------------------------------------------------
// Accessible field component
// ---------------------------------------------------------------------------

type FieldProps = {
  label: string;
  id: string;
  errorId?: string;
  error?: string;
  children: React.ReactNode;
};

function Field({ label, id, errorId, error, children }: FieldProps) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-bold text-neutral-950" htmlFor={id}>
        {label}
      </label>
      {children}
      {error && (
        <p
          className="text-sm text-red-700"
          id={errorId}
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section heading
// ---------------------------------------------------------------------------

function SectionHeading({
  icon: Icon,
  title,
}: {
  icon: typeof CalendarDays;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-[var(--nx-line)] pb-3">
      <Icon aria-hidden="true" className="h-4 w-4 text-[var(--nx-accent)]" />
      <h2 className="text-sm font-black uppercase tracking-[0.14em] text-neutral-950">
        {title}
      </h2>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared input className
// ---------------------------------------------------------------------------

const inputBase =
  "min-h-12 w-full rounded-md border border-[var(--nx-line)] bg-white px-4 text-base outline-none transition focus:border-neutral-950 aria-invalid:border-red-500";

// ---------------------------------------------------------------------------
// Today's date for min attribute
// ---------------------------------------------------------------------------

function todayIso(): string {
  return new Date().toISOString().split("T")[0];
}

// ---------------------------------------------------------------------------
// BookingForm
// ---------------------------------------------------------------------------

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
      driverName: "",
      driverEmail: "",
      driverPhone: "",
      notes: "",
    },
  });

  const pickupDate = watch("pickupDate");

  // ---------------------------------------------------------------------------
  // Field IDs
  // ---------------------------------------------------------------------------
  const pickupDateId = useId();
  const returnDateId = useId();
  const driverNameId = useId();
  const driverEmailId = useId();
  const driverPhoneId = useId();
  const notesId = useId();

  const pickupDateErrorId = useId();
  const returnDateErrorId = useId();
  const driverNameErrorId = useId();
  const driverEmailErrorId = useId();
  const driverPhoneErrorId = useId();

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  async function onSubmit(values: BookingFormSchema) {
    await onSubmitReady(values);
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <form
      aria-describedby={submitError ? formErrorId : undefined}
      className="grid gap-8"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Trip dates section                                                   */}
      {/* ------------------------------------------------------------------ */}
      <section aria-labelledby="trip-dates-heading" className="grid gap-5">
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

      {/* ------------------------------------------------------------------ */}
      {/* Driver / contact section                                             */}
      {/* ------------------------------------------------------------------ */}
      <section aria-labelledby="driver-info-heading" className="grid gap-5">
        <SectionHeading icon={User} title="Driver information" />

        <Field
          error={errors.driverName?.message}
          errorId={driverNameErrorId}
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
            placeholder="As it appears on your driving licence"
            type="text"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            error={errors.driverEmail?.message}
            errorId={driverEmailErrorId}
            id={driverEmailId}
            label="Email address"
          >
            <input
              {...register("driverEmail")}
              aria-describedby={
                errors.driverEmail ? driverEmailErrorId : undefined
              }
              aria-invalid={!!errors.driverEmail}
              autoComplete="email"
              className={inputBase}
              id={driverEmailId}
              inputMode="email"
              placeholder="Confirmation will be sent here"
              type="email"
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
        </div>

        <Field id={notesId} label="Notes (optional)">
          <textarea
            {...register("notes")}
            className="min-h-24 w-full resize-y rounded-md border border-[var(--nx-line)] bg-white px-4 py-3 text-base outline-none transition focus:border-neutral-950"
            id={notesId}
            maxLength={500}
            placeholder="Any specific requirements or questions for the operator."
            rows={3}
          />
        </Field>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Backend submission error                                             */}
      {/* ------------------------------------------------------------------ */}
      {submitError && (
        <div
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
          id={formErrorId}
          role="alert"
        >
          <p className="font-bold">Reservation could not be created.</p>
          <p className="mt-1">{submitError}</p>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Submit CTA                                                           */}
      {/* ------------------------------------------------------------------ */}
      <div className="border-t border-[var(--nx-line)] pt-6">
        <button
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-neutral-950 px-5 text-sm font-black text-white transition disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Creating reservation…" : "Review and create reservation"}
        </button>
        <p className="mt-3 text-xs leading-5 text-neutral-500">
          Submitting this form sends your trip details to the backend to create a
          reservation and payment intent. No charge is made until you confirm
          payment on the next step.
        </p>
      </div>
    </form>
  );
}
