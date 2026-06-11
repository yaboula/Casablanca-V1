"use client";

/**
 * BookingForm - trip details and driver contact form.
 *
 * Fields map to the real backend CreateReservationDto:
 *   vehicleId (from route) -> passed via onSubmitReady
 *   pickupDate -> required ISO date
 *   returnDate -> required ISO date, must be after pickup
 *   pickupLocation -> required enum (CMN_T1 | CMN_T2)
 *   driverName -> maps to customerName
 *   driverPhone -> maps to customerPhone
 *
 * WhatsApp is prepared visually only and is not submitted until backend support exists.
 */

import { useEffect, useId, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  CalendarDays,
  Check,
  MapPin,
  MessageCircle,
  User,
} from "lucide-react";
import {
  bookingFormSchema,
  type BookingFormSchema,
  type BookingFormInput,
} from "./booking-schema";
import { BookingDateRangePicker } from "./booking-date-range-picker";
import { InternationalPhoneInput } from "./international-phone-input";
import { PICKUP_LOCATIONS, type PickupLocation } from "./types";

export type BookingFormProps = {
  vehicleId: string;
  pricePerDayEurCents: number;
  onDraftChange?: (values: {
    pickupDate: string;
    returnDate: string;
    pickupLocation?: string;
  }) => void;
  onSubmitReady: (values: BookingFormSchema) => void | Promise<void>;
  isSubmitting?: boolean;
  isSubmitDisabled?: boolean;
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
      <label
        className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500"
        htmlFor={id}
      >
        {label}
      </label>
      {hint && <p className="text-xs font-light text-neutral-500">{hint}</p>}
      {children}
      {error && (
        <p className="text-xs font-medium text-red-600" id={errorId} role="alert">
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
      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200/60 bg-neutral-50 text-[#1E41FC] shadow-sm">
        <Icon aria-hidden="true" className="h-4 w-4" />
      </span>
      <h2 className="text-[10px] font-semibold uppercase tracking-widest text-neutral-800">
        {title}
      </h2>
    </div>
  );
}

const inputBase =
  "w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition-all duration-300 focus:border-[#1E41FC] focus:ring-2 focus:ring-[#1E41FC]/10 aria-invalid:border-red-500";

export function BookingForm({
  pricePerDayEurCents,
  onDraftChange,
  onSubmitReady,
  isSubmitting = false,
  isSubmitDisabled = false,
  submitError = null,
}: BookingFormProps) {
  const formErrorId = useId();
  const [whatsappPhone, setWhatsappPhone] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<BookingFormInput, unknown, BookingFormSchema>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      pickupDate: "",
      returnDate: "",
      pickupLocation: undefined,
      driverName: "",
      driverPhone: "+212",
    },
  });

  const pickupDate = watch("pickupDate");
  const returnDate = watch("returnDate");
  const pickupLocation = watch("pickupLocation");
  const driverPhone = watch("driverPhone");

  const pickupDateId = useId();
  const returnDateId = useId();
  const pickupLocationId = useId();
  const driverNameId = useId();
  const driverPhoneId = useId();
  const whatsappPhoneId = useId();

  const pickupDateErrorId = useId();
  const returnDateErrorId = useId();
  const pickupLocationErrorId = useId();
  const driverNameErrorId = useId();
  const driverPhoneErrorId = useId();

  useEffect(() => {
    onDraftChange?.({
      pickupDate,
      returnDate,
      pickupLocation,
    });
  }, [onDraftChange, pickupDate, pickupLocation, returnDate]);

  async function onSubmit(values: BookingFormSchema) {
    await onSubmitReady(values);
  }

  function updateDateRange(range: { pickupDate: string; returnDate: string }) {
    setValue("pickupDate", range.pickupDate, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("returnDate", range.returnDate, {
      shouldDirty: true,
      shouldValidate: true,
    });
    void trigger(["pickupDate", "returnDate"]);
  }

  function updatePickupLocation(value: PickupLocation) {
    setValue("pickupLocation", value, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function updateDriverPhone(value: string) {
    setValue("driverPhone", value, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  return (
    <form
      aria-describedby={submitError ? formErrorId : undefined}
      className="grid gap-7"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
    >
      <section className="grid gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <SectionHeading icon={CalendarDays} title="Trip dates" />
        <BookingDateRangePicker
          basePricePerDayEurCents={pricePerDayEurCents}
          pickupDate={pickupDate}
          returnDate={returnDate}
          onChange={updateDateRange}
          pickupError={errors.pickupDate?.message}
          pickupErrorId={pickupDateErrorId}
          returnError={errors.returnDate?.message}
          returnErrorId={returnDateErrorId}
        />
        <input id={pickupDateId} type="hidden" {...register("pickupDate")} />
        <input id={returnDateId} type="hidden" {...register("returnDate")} />
      </section>

      <section className="grid gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <SectionHeading icon={MapPin} title="Pickup terminal" />
        <div
          aria-describedby={
            errors.pickupLocation ? pickupLocationErrorId : undefined
          }
          aria-invalid={!!errors.pickupLocation}
          aria-labelledby={pickupLocationId}
          className="grid gap-3 sm:grid-cols-2"
          role="radiogroup"
        >
          <span className="sr-only" id={pickupLocationId}>
            Airport terminal
          </span>
          {PICKUP_LOCATIONS.map((location) => {
            const isSelected = pickupLocation === location.value;
            const detail =
              location.value === "CMN_T1"
                ? "International and main arrivals"
                : "Selected airline and arrival dependent";

            return (
              <button
                key={location.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={[
                  "min-h-24 rounded-[1rem] border p-4 text-left transition-all focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[var(--nx-accent)]",
                  isSelected
                    ? "border-neutral-950 bg-neutral-950 text-white"
                    : "border-neutral-200 bg-white text-neutral-900 hover:border-neutral-400",
                ].join(" ")}
                onClick={() => updatePickupLocation(location.value)}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold">
                    {location.value === "CMN_T1" ? "Terminal 1" : "Terminal 2"}
                  </span>
                  {isSelected && <Check className="h-4 w-4" />}
                </span>
                <span
                  className={[
                    "mt-2 block text-xs leading-5",
                    isSelected ? "text-white/70" : "text-neutral-500",
                  ].join(" ")}
                >
                  {detail}
                </span>
              </button>
            );
          })}
        </div>
        {errors.pickupLocation?.message && (
          <p
            className="text-xs font-medium text-red-600"
            id={pickupLocationErrorId}
            role="alert"
          >
            {errors.pickupLocation.message}
          </p>
        )}
      </section>

      <section className="grid gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
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

        <InternationalPhoneInput
          error={errors.driverPhone?.message}
          errorId={driverPhoneErrorId}
          hint="Use a number where the CMN team can reach you by call."
          id={driverPhoneId}
          label="Phone number"
          value={driverPhone}
          onChange={updateDriverPhone}
        />
      </section>

      <section className="grid gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <SectionHeading icon={MessageCircle} title="WhatsApp contact" />
        <InternationalPhoneInput
          hint="Prepared for WhatsApp contact preferences. The reservation contact remains the phone number above."
          id={whatsappPhoneId}
          label="WhatsApp number"
          value={whatsappPhone}
          onChange={setWhatsappPhone}
        />
      </section>

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

      <div className="space-y-3 border-t border-neutral-100 pt-6">
        <button
          className="nx-btn-primary inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white shadow-sm transition-colors duration-300 hover:bg-[#1E41FC] disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.97]"
          disabled={isSubmitting || isSubmitDisabled}
          type="submit"
        >
          {isSubmitting
            ? "Creating reservation..."
            : "Create reservation and continue to payment"}
          <ArrowRight className="h-4 w-4" />
        </button>
        <p className="text-[10px] font-light leading-relaxed text-neutral-500">
          We create your reservation and prepare secure payment authorization.
          You review the final total and authorize the refundable deposit on
          the next screen.
        </p>
      </div>
    </form>
  );
}
