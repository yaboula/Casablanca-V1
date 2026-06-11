/**
 * Zod validation schema for the booking form.
 *
 * Fields validated here map exactly to what the backend DTO accepts:
 * - vehicleId (handled by route, not form)
 * - pickupDate (ISO date/time string)
 * - returnDate (ISO date/time string)
 * - pickupLocation (CMN_T1 | CMN_T2)
 * - customerName (optional driver name, max 120)
 * - customerPhone (optional, phone format)
 *
 * Fields NOT in the backend DTO and therefore NOT in this schema:
 * - email (backend auth user owns this)
 * - notes (not accepted by backend DTO)
 * - totalPrice, deposit (server-computed, never trusted from client)
 */
import { z } from "zod";
import { PICKUP_LOCATIONS } from "./types";

// Date helpers

const isoDateRegex = /^\d{4}-\d{2}-\d{2}/;

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

// Field schemas

const pickupDateSchema = z
  .string()
  .min(1, "Pickup date and time are required.")
  .refine(isValidDate, "Pickup date and time must be valid.")
  .refine(
    isTodayOrFuture,
    "Pickup date and time must be today or in the future.",
  );

const returnDateSchema = z
  .string()
  .min(1, "Return date and time are required.")
  .refine(isValidDate, "Return date and time must be valid.");

const pickupLocationSchema = z.enum(
  PICKUP_LOCATIONS.map((l) => l.value) as [string, ...string[]],
  { errorMap: () => ({ message: "Please select an airport terminal." }) },
);

/**
 * Driver name maps to customerName in backend DTO (optional).
 * Required in UI for operational clarity even though backend marks it optional.
 */
const driverNameSchema = z
  .string()
  .min(2, "Full name must be at least 2 characters.")
  .max(120, "Full name must be 120 characters or fewer.");

/**
 * Phone: backend validates with /^\+?[0-9\s\-().]{7,30}$/.
 * Required in UI even though backend marks it optional.
 */
const driverPhoneSchema = z
  .string()
  .min(6, "Phone number is required and must be at least 6 characters.")
  .max(30, "Phone number must be 30 characters or fewer.")
  .regex(
    /^\+?[0-9\s\-().]{6,30}$/,
    "Please enter a valid phone number (digits, spaces, +, -, parentheses).",
  );

export const bookingFormSchema = z
  .object({
    pickupDate: pickupDateSchema,
    returnDate: returnDateSchema,
    pickupLocation: pickupLocationSchema,
    driverName: driverNameSchema,
    driverPhone: driverPhoneSchema,
  })
  .refine(
    (data) => {
      if (!isValidDate(data.pickupDate) || !isValidDate(data.returnDate)) {
        return true;
      }
      return new Date(data.returnDate) > new Date(data.pickupDate);
    },
    {
      message: "Return date and time must be after pickup.",
      path: ["returnDate"],
    },
  );

export type BookingFormSchema = z.infer<typeof bookingFormSchema>;

/**
 * Input type (what react-hook-form uses internally).
 * pickupLocation is optional at input because enum resolution may differ.
 */
export type BookingFormInput = z.input<typeof bookingFormSchema>;
