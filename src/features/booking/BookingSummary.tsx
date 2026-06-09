/**
 * BookingSummary — displays read-only vehicle and trip details in the booking panel.
 *
 * This component is intentionally display-only:
 * - Vehicle data comes from the server-fetched VehicleDetailModel.
 * - Prices shown are from the backend vehicle record (display hint only).
 * - Day count is a UI-display helper — backend owns canonical pricing.
 * - No reservation state, no payment state, no fake totals.
 */
import Image from "next/image";
import { CalendarDays, Car, MapPin } from "lucide-react";
import type { VehicleDetailModel } from "@/features/catalog/types";
import { computeDisplayDays } from "./booking-schema";

type BookingSummaryProps = {
  vehicle: VehicleDetailModel;
  pickupDate: string;
  returnDate: string;
  /** Pickup terminal, e.g. "CMN_T1" or "CMN_T2" — empty string before selection */
  pickupLocation?: string;
};

const TERMINAL_LABELS: Record<string, string> = {
  CMN_T1: "Terminal 1 (CMN T1)",
  CMN_T2: "Terminal 2 (CMN T2)",
};

export function BookingSummary({
  vehicle,
  pickupDate,
  returnDate,
  pickupLocation,
}: BookingSummaryProps) {
  const displayDays = computeDisplayDays(pickupDate, returnDate);
  const priceEur = vehicle.pricePerDayEurCents / 100;

  return (
    <aside
      aria-label="Booking summary"
      className="rounded-lg border border-[var(--nx-line)] bg-white"
    >
      {/* Vehicle image */}
      {vehicle.primaryImageUrl && (
        <div className="relative h-44 w-full overflow-hidden rounded-t-lg bg-neutral-100">
          <Image
            alt={vehicle.name}
            className="object-cover"
            fill
            sizes="(max-width: 1024px) 100vw, 400px"
            src={vehicle.primaryImageUrl}
          />
        </div>
      )}

      <div className="space-y-5 p-5">
        {/* Vehicle identity */}
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">
            {formatCategory(vehicle.category)}
          </p>
          <p className="mt-1 text-xl font-black text-neutral-950">
            {vehicle.name}
          </p>
          <p className="mt-1 text-sm text-neutral-600">
            {vehicle.brand} {vehicle.model}
          </p>
        </div>

        {/* Pickup location */}
        <div className="flex items-start gap-2 border-t border-[var(--nx-line)] pt-4">
          <MapPin
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0 text-[var(--nx-accent)]"
          />
          <div>
            <p className="text-xs font-bold text-neutral-950">Pickup location</p>
            <p className="mt-0.5 text-sm text-neutral-600">
              Casablanca Mohammed V Airport (CMN)
            </p>
            {pickupLocation && TERMINAL_LABELS[pickupLocation] && (
              <p className="mt-0.5 text-sm font-bold text-neutral-950">
                {TERMINAL_LABELS[pickupLocation]}
              </p>
            )}
          </div>
        </div>

        {/* Trip dates */}
        {pickupDate && returnDate && (
          <div className="flex items-start gap-2 border-t border-[var(--nx-line)] pt-4">
            <CalendarDays
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0 text-[var(--nx-accent)]"
            />
            <div>
              <p className="text-xs font-bold text-neutral-950">Trip dates</p>
              <p className="mt-0.5 text-sm text-neutral-600">
                {formatDate(pickupDate)} &rarr; {formatDate(returnDate)}
              </p>
              {displayDays !== null && (
                <p className="mt-0.5 text-sm font-bold text-neutral-950">
                  {displayDays} {displayDays === 1 ? "day" : "days"}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Price — display hint only, backend is canonical */}
        <div className="flex items-start gap-2 border-t border-[var(--nx-line)] pt-4">
          <Car
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0 text-[var(--nx-accent)]"
          />
          <div className="flex-1">
            <p className="text-xs font-bold text-neutral-950">Rate</p>
            <p className="mt-0.5 text-xl font-black text-neutral-950">
              €{priceEur.toFixed(2)}
              <span className="ml-1 text-sm font-semibold text-neutral-500">
                / day
              </span>
            </p>
            {displayDays !== null && (
              <p className="mt-1 text-xs text-neutral-500">
                Estimated: €{(priceEur * displayDays).toFixed(2)} for{" "}
                {displayDays} {displayDays === 1 ? "day" : "days"}
              </p>
            )}
            <p className="mt-2 text-xs leading-5 text-neutral-500">
              Final total and deposit are calculated and confirmed by the backend
              after reservation creation. This is a display estimate only.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

function formatCategory(category: string | null): string {
  if (!category) return "Vehicle";
  const labels: Record<string, string> = {
    SEDAN: "Sedan",
    SUV: "SUV",
    LUXURY: "Luxury",
    COMPACT: "Compact",
  };
  return labels[category] ?? category;
}

function formatDate(iso: string): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
