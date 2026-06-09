/**
 * Zod validation schema for the booking form.
 *
 * Validates user-entered fields only. Backend-owned fields (totals, reservation
 * UUID, payment state) are never part of this schema.
 */
import { z } from "zod";

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(value: string): boolean {
  if (!isoDateRegex.test(value)) return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
}

function isTodayOrFuture(value: string): boolean {
  const date = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
}

// ---------------------------------------------------------------------------
// Field schemas
// ---------------------------------------------------------------------------

const pickupDateSchema = z
  .string()
  .min(1, "Pickup date is required.")
  .refine(isValidDate, "Pickup date must be a valid date.")
  .refine(isTodayOrFuture, "Pickup date must be today or in the future.");

const returnDateSchema = z
  .string()
  .min(1, "Return date is required.")
  .refine(isValidDate, "Return date must be a valid date.");

const driverNameSchema = z
  .string()
  .min(2, "Full name must be at least 2 characters.")
  .max(120, "Full name must be 120 characters or fewer.");

const driverEmailSchema = z
  .string()
  .min(1, "Email address is required.")
  .email("Please enter a valid email address.");

/**
 * Phone: allow common international formats.
 * Backend performs definitive validation; this is UX-level only.
 */
const driverPhoneSchema = z
  .string()
  .min(6, "Phone number is required and must be at least 6 characters.")
  .max(30, "Phone number must be 30 characters or fewer.")
  .regex(
    /^\+?[\d\s\-().]{6,30}$/,
    "Please enter a valid phone number (digits, spaces, +, -, parentheses).",
  );

const notesSchema = z
  .string()
  .max(500, "Notes must be 500 characters or fewer.")
  .default("");

// ---------------------------------------------------------------------------
// Composite booking form schema
// ---------------------------------------------------------------------------

export const bookingFormSchema = z
  .object({
    pickupDate: pickupDateSchema,
    returnDate: returnDateSchema,
    driverName: driverNameSchema,
    driverEmail: driverEmailSchema,
    driverPhone: driverPhoneSchema,
    notes: notesSchema,
  })
  .refine(
    (data) => {
      if (!isValidDate(data.pickupDate) || !isValidDate(data.returnDate)) {
        return true; // Field-level errors already cover this
      }
      return new Date(data.returnDate) > new Date(data.pickupDate);
    },
    {
      message: "Return date must be after the pickup date.",
      path: ["returnDate"],
    },
  );

export type BookingFormSchema = z.infer<typeof bookingFormSchema>;

/**
 * Input type (what react-hook-form uses internally).
 * notes is optional at input because the schema has a .default("").
 */
export type BookingFormInput = z.input<typeof bookingFormSchema>;

// ---------------------------------------------------------------------------
// Duration helper (display only — backend owns canonical total)
// ---------------------------------------------------------------------------

/**
 * Computes display-only day count for UI summary.
 * This value is NEVER sent to the backend as a total or truth.
 * Backend computes the definitive duration and pricing.
 */
export function computeDisplayDays(
  pickupDate: string,
  returnDate: string,
): number | null {
  if (!isValidDate(pickupDate) || !isValidDate(returnDate)) return null;
  const start = new Date(pickupDate);
  const end = new Date(returnDate);
  const diffMs = end.getTime() - start.getTime();
  if (diffMs <= 0) return null;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}
