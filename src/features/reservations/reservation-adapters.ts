/**
 * Reservation adapters — maps raw backend DTO to frontend view models.
 *
 * Follows the same defensive adaptation pattern as vehicle-adapters.ts:
 * - All fields typed as `unknown` at input
 * - Each field validated and normalized
 * - Returns null if required fields are missing/invalid
 * - Plain JSON output safe to cross server→client boundary
 */

import type {
  ReservationApi,
  ReservationStatus,
  DepositStatus,
  DepositRefundStatus,
  PickupLocation,
  ReservationVehicleModel,
  ReservationViewModel,
} from "./types";

// ---------------------------------------------------------------------------
// Allowed values for enum fields
// ---------------------------------------------------------------------------

const RESERVATION_STATUSES = new Set<string>([
  "PENDING_DEPOSIT",
  "AWAITING_CAPTURE",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);

const PICKUP_LOCATIONS = new Set<string>(["CMN_T1", "CMN_T2"]);
const DEPOSIT_STATUSES = new Set<string>([
  "PENDING",
  "CAPTURE_QUEUED",
  "CAPTURED",
  "FAILED",
  "CANCELLED",
]);
const DEPOSIT_REFUND_STATUSES = new Set<string>([
  "NOT_APPLICABLE",
  "NOT_REQUESTED",
  "PENDING",
  "SUCCEEDED",
  "FAILED",
]);

// ---------------------------------------------------------------------------
// Primitive helpers (mirrored from vehicle-adapters for consistency)
// ---------------------------------------------------------------------------

function asNonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function asNonNegativeInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : null;
}

function asPositiveInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : null;
}

function asEnum<T extends string>(
  value: unknown,
  allowed: Set<string>,
): T | null {
  return typeof value === "string" && allowed.has(value) ? (value as T) : null;
}

function asIsoString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  if (isNaN(date.getTime())) return null;
  return date.toISOString();
}

// ---------------------------------------------------------------------------
// Embedded vehicle adapter
// ---------------------------------------------------------------------------

function adaptReservationVehicle(
  value: unknown,
): ReservationVehicleModel | null {
  if (typeof value !== "object" || value === null) return null;

  const v = value as Record<string, unknown>;
  const id = asNonEmptyString(v.id);
  const brand = asNonEmptyString(v.brand);
  const model = asNonEmptyString(v.model);

  if (!id) return null;

  const name =
    brand && model
      ? `${brand} ${model}`
      : asNonEmptyString(v.name) ?? "Vehicle";

  return {
    id,
    name,
    imageUrl: asNonEmptyString(v.imageUrl),
    pricePerDayEurCents: asNonNegativeInteger(v.pricePerDayEurCents),
    category: asNonEmptyString(v.category),
  };
}

// ---------------------------------------------------------------------------
// Main adapter
// ---------------------------------------------------------------------------

/**
 * Adapts a raw backend reservation API object to a safe view model.
 * Returns null if the reservation id is missing (cannot identify the resource).
 *
 */
export function adaptReservation(
  input: ReservationApi,
): ReservationViewModel | null {
  const id = asNonEmptyString(input.id);
  if (!id) return null;

  const status = asEnum<ReservationStatus>(
    input.status,
    RESERVATION_STATUSES,
  );
  const pickupDate = asIsoString(input.pickupDate);
  const returnDate = asIsoString(input.returnDate);

  if (!status || !pickupDate || !returnDate) return null;

  const totalPriceEurCents = asNonNegativeInteger(input.totalPriceEurCents);
  const depositEurCents = asNonNegativeInteger(input.depositEurCents);
  const totalDays = asPositiveInteger(input.totalDays);

  // Financial fields must all be present (backend computes them at creation)
  if (totalPriceEurCents === null || depositEurCents === null || totalDays === null) {
    return null;
  }

  return {
    id,
    status,
    pickupDate,
    returnDate,
    totalDays,
    totalPriceEurCents,
    depositEurCents,
    pickupLocation: asEnum<PickupLocation>(
      input.pickupLocation,
      PICKUP_LOCATIONS,
    ),
    depositStatus: asEnum<DepositStatus>(
      input.depositStatus,
      DEPOSIT_STATUSES,
    ),
    depositCapturedAt: asIsoString(input.depositCapturedAt),
    depositLastFailureAt: asIsoString(input.depositLastFailureAt),
    depositLastFailureReason: asNonEmptyString(input.depositLastFailureReason),
    depositRefundStatus: asEnum<DepositRefundStatus>(
      input.depositRefundStatus,
      DEPOSIT_REFUND_STATUSES,
    ),
    depositRefundAttemptedAt: asIsoString(input.depositRefundAttemptedAt),
    depositRefundFailureAt: asIsoString(input.depositRefundFailureAt),
    depositRefundFailureReason: asNonEmptyString(
      input.depositRefundFailureReason,
    ),
    customerName: asNonEmptyString(input.customerName),
    customerPhone: asNonEmptyString(input.customerPhone),
    vehicle: adaptReservationVehicle(input.vehicle),
    createdAt: asIsoString(input.createdAt) ?? new Date().toISOString(),
  };
}
