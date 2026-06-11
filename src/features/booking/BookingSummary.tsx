import Image from "next/image";
import { CalendarDays, Car, Check, MapPin, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import {
  formatEurCents,
  formatMadFromEurCents,
} from "@/features/catalog/format-price";
import type { VehicleDetailModel } from "@/features/catalog/types";
import type { QuoteViewModel } from "./types";

type BookingSummaryProps = {
  vehicle: VehicleDetailModel;
  pickupDate: string;
  returnDate: string;
  pickupLocation?: string;
  quote?: QuoteViewModel | null;
  isQuoteLoading?: boolean;
  quoteError?: string | null;
};

const TERMINAL_LABELS: Record<string, string> = {
  CMN_T1: "Terminal 1 (CMN T1)",
  CMN_T2: "Terminal 2 (CMN T2)",
};

const SUMMARY_ASSURANCES = [
  "Airport handoff included at CMN",
  "Terminal pickup prepared in advance",
  "No unexpected deposit collection at arrivals",
  "Final total confirmed before payment authorization",
];

export function BookingSummary({
  vehicle,
  pickupDate,
  returnDate,
  pickupLocation,
  quote = null,
  isQuoteLoading = false,
  quoteError = null,
}: BookingSummaryProps) {
  const hasDates = Boolean(pickupDate && returnDate);

  return (
    <aside
      aria-label="Booking summary"
      className="overflow-hidden rounded-[1.25rem] border border-[var(--nx-line)] bg-white lg:sticky lg:top-24"
    >
      {vehicle.primaryImageUrl && (
        <div className="relative h-44 w-full overflow-hidden bg-neutral-100">
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

        <SummaryRow icon={MapPin} title="Pickup location">
          <p className="mt-0.5 text-sm text-neutral-600">
            Casablanca Mohammed V Airport (CMN)
          </p>
          <p className="mt-2 inline-flex rounded-full bg-neutral-950 px-3 py-1.5 text-xs font-semibold text-white">
            {pickupLocation && TERMINAL_LABELS[pickupLocation]
              ? `${TERMINAL_LABELS[pickupLocation]} selected`
              : "Select Terminal 1 or Terminal 2"}
          </p>
        </SummaryRow>

        {hasDates && (
          <SummaryRow icon={CalendarDays} title="Trip dates">
            <p className="mt-0.5 text-sm text-neutral-600">
              {formatDateTime(pickupDate)} - {formatDateTime(returnDate)}
            </p>
            {quote && quote.available && (
              <p className="mt-0.5 text-sm font-bold text-neutral-950">
                {quote.pricing.chargedDayUnits} rental day(s)
              </p>
            )}
          </SummaryRow>
        )}

        <SummaryRow icon={Car} title="Estimated reservation price">
          <div aria-live="polite" className="mt-2 rounded-2xl border border-neutral-200 bg-[#FAFAFA] p-4 transition-all">
            {isQuoteLoading ? (
               <div className="flex flex-col items-center justify-center py-6 text-neutral-500">
                 <Loader2 className="h-6 w-6 animate-spin text-[var(--nx-accent)] mb-2" />
                 <p className="text-sm font-medium">Calculating quote...</p>
               </div>
            ) : quoteError ? (
               <div role="alert" className="flex flex-col items-start text-red-700 py-3">
                 <div className="flex items-center gap-2 mb-1">
                   <AlertCircle className="h-5 w-5" />
                   <p className="text-sm font-bold">Could not calculate quote. Try again.</p>
                 </div>
                 <p className="text-xs">{quoteError}</p>
               </div>
            ) : quote && !quote.available ? (
               <div role="alert" className="flex flex-col items-start py-3">
                 <div className="flex items-center gap-2 mb-1 text-red-700">
                   <AlertCircle className="h-5 w-5" />
                   <p className="text-sm font-bold">Vehicle unavailable for selected period</p>
                 </div>
                 <p className="text-xs text-neutral-600">Try different dates</p>
               </div>
            ) : quote ? (
               <>
                 <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                  <span className="font-display text-3xl font-light leading-none text-neutral-950">
                    {formatEurCents(quote.pricing.estimatedTotalEurCents)}
                  </span>
                  <div className="flex flex-col pb-1">
                    <span className="text-sm font-semibold text-neutral-700">
                      Charged as {quote.pricing.chargedDayUnits} day(s)
                    </span>
                    {quote.pricing.extraBillingType === "GRACE" && (
                      <span className="text-xs font-semibold text-emerald-600">3h grace applied</span>
                    )}
                    {quote.pricing.extraBillingType === "HALF_DAY" && (
                      <span className="text-xs font-semibold text-amber-600">Half-day extra time applied</span>
                    )}
                    {quote.pricing.extraBillingType === "FULL_DAY" && (
                      <span className="text-xs font-semibold text-[#1E41FC]">Extra day applied</span>
                    )}
                  </div>
                 </div>
                 <p className="mt-3 text-sm font-bold text-neutral-800">
                   Approx. {formatMadFromEurCents(quote.pricing.estimatedTotalEurCents)}
                 </p>
                 
                 <p className="mt-4 text-xs font-bold leading-5 text-neutral-800">
                   Refundable deposit: {formatEurCents(quote.pricing.depositEurCents)}
                 </p>
                 <p className="mt-2 text-xs font-light leading-5 text-neutral-600">
                   Final total and refundable deposit are calculated by Nexus before payment.
                 </p>
               </>
            ) : (
               <>
                 <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                  <span className="font-display text-3xl font-light leading-none text-neutral-950">
                    From {formatEurCents(vehicle.pricePerDayEurCents)}
                  </span>
                  <span className="pb-1 text-sm font-semibold text-neutral-700">
                    / day
                  </span>
                 </div>
                 <p className="mt-4 text-xs font-bold leading-5 text-neutral-800">
                   Select dates to estimate the charged rental period.
                 </p>
                 <p className="mt-2 text-xs font-light leading-5 text-neutral-600">
                   Your total will update after pickup and return dates are selected. Final total and deposit are confirmed before payment.
                 </p>
               </>
            )}
          </div>

          <div className="mt-4 grid gap-3 rounded-2xl bg-neutral-50 p-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[#1E41FC] ring-1 ring-neutral-200">
                <ShieldCheck aria-hidden="true" className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-neutral-900">
                  Time policy
                </p>
                <p className="mt-1 text-xs font-light leading-5 text-neutral-600">
                  Up to 3h extra is free. Over 3h and under 12h is estimated as a half-day. 12h or more is estimated as one extra day.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500">
              Included before pickup
            </p>
            <ul className="mt-3 grid gap-2">
              {SUMMARY_ASSURANCES.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-xs font-medium leading-5 text-neutral-700"
                >
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#1E41FC] text-white">
                    <Check aria-hidden="true" className="h-3 w-3" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </SummaryRow>
      </div>
    </aside>
  );
}

function SummaryRow({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof CalendarDays;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 border-t border-[var(--nx-line)] pt-4">
      <Icon
        aria-hidden="true"
        className="mt-0.5 h-4 w-4 shrink-0 text-[var(--nx-accent)]"
      />
      <div className="flex-1">
        <p className="text-xs font-bold text-neutral-950">{title}</p>
        {children}
      </div>
    </div>
  );
}

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

function formatDateTime(iso: string): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
