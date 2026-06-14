"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
} from "lucide-react";
import { getVehicleAvailabilityCalendar } from "./booking-service";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  ExtraBillingType,
  PricingQuote,
  VehicleAvailabilityCalendar,
  VehicleAvailabilityDayStatus,
} from "./types";

export type CalendarDayPrice = {
  date: string;
  available: boolean;
  availabilityStatus: VehicleAvailabilityDayStatus | "PAST";
  pricePerDayEurCents: number;
  priceSource: "base-rate" | "backend-calendar" | "dynamic";
};

type BookingDateRangePickerProps = {
  vehicleId: string;
  pickupDate: string;
  returnDate: string;
  basePricePerDayEurCents: number;
  quotePricing?: Pick<
    PricingQuote,
    "extraBillingType" | "extraHours" | "fullDays"
  > | null;
  onChange: (range: { pickupDate: string; returnDate: string }) => void;
  pickupError?: string;
  returnError?: string;
  pickupErrorId?: string;
  returnErrorId?: string;
};

const DEFAULT_PICKUP_TIME = "10:00";
const DEFAULT_RETURN_TIME = "10:00";
const DEFAULT_TURNAROUND_BUFFER_HOURS = 4;
const TIME_OPTIONS = Array.from({ length: 29 }, (_, index) => {
  const totalMinutes = 6 * 60 + index * 30;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
});

const dayFormatter = new Intl.DateTimeFormat("en-GB", { weekday: "short" });
const monthFormatter = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
});
const longDateFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});
const priceFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function BookingDateRangePicker({
  vehicleId,
  pickupDate,
  returnDate,
  basePricePerDayEurCents,
  quotePricing = null,
  onChange,
  pickupError,
  returnError,
  pickupErrorId,
  returnErrorId,
}: BookingDateRangePickerProps) {
  const today = startOfDay(new Date());
  const pickupLocal = parseLocalValue(pickupDate);
  const returnLocal = parseLocalValue(returnDate);
  const initialMonth = pickupLocal.date ? parseIsoDate(pickupLocal.date) : today;
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1),
  );
  const [availabilityCalendar, setAvailabilityCalendar] =
    useState<VehicleAvailabilityCalendar | null>(null);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const calendarRange = useMemo(() => getVisibleCalendarRange(visibleMonth), [
    visibleMonth,
  ]);

  useEffect(() => {
    const controller = new AbortController();

    getVehicleAvailabilityCalendar(
      vehicleId,
      calendarRange.from,
      calendarRange.to,
      controller.signal,
    )
      .then((calendar) => {
        if (!controller.signal.aborted) {
          setAvailabilityCalendar(calendar);
          setAvailabilityError(null);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setAvailabilityCalendar(null);
          setAvailabilityError(
            "Live availability could not be loaded. Final availability is still checked before payment.",
          );
        }
      });

    return () => controller.abort();
  }, [calendarRange.from, calendarRange.to, vehicleId]);

  const days = buildCalendarDays(
    visibleMonth,
    today,
    basePricePerDayEurCents,
    availabilityCalendar,
  );
  const hasDates = Boolean(pickupLocal.date && returnLocal.date);
  const blockedIntervals = availabilityCalendar?.blockedIntervals ?? [];
  const turnaroundBufferHours =
    availabilityCalendar?.operationalBufferHours ?? DEFAULT_TURNAROUND_BUFFER_HOURS;
  const extraChargeDate = getExtraChargeDate(pickupDate, quotePricing);





  function selectDate(date: string) {
    const selectedDay = days.find((day) => day.date === date);
    if (!selectedDay?.available) return;

    if (
      !pickupLocal.date ||
      (pickupLocal.date && returnLocal.date) ||
      date <= pickupLocal.date
    ) {
      const firstPickupTime = getFirstAvailableTime({
        mode: "pickup",
        date,
        pickupDate: date,
        returnDate: "",
        blockedIntervals,
        turnaroundBufferHours,
      });
      if (!firstPickupTime) return;

      onChange({
        pickupDate: toUtcIso(date, firstPickupTime),
        returnDate: "",
      });
      setHoveredDate(null);
      return;
    }

    const firstReturnTime = getFirstAvailableTime({
      mode: "return",
      date,
      pickupDate: pickupLocal.date,
      returnDate: date,
      blockedIntervals,
      turnaroundBufferHours,
    });
    if (!firstReturnTime) return;

    onChange({
      pickupDate: toUtcIso(
        pickupLocal.date,
        pickupLocal.time || DEFAULT_PICKUP_TIME,
      ),
      returnDate: toUtcIso(date, firstReturnTime),
    });
    setHoveredDate(null);
  }

  function updatePickupTime(time: string) {
    if (!pickupLocal.date) return;
    if (
      isTimeDisabled({
        mode: "pickup",
        date: pickupLocal.date,
        time,
        pickupDate: pickupLocal.date,
        returnDate: returnLocal.date,
        blockedIntervals,
        turnaroundBufferHours,
      })
    ) {
      return;
    }

    onChange({
      pickupDate: toUtcIso(pickupLocal.date, time),
      returnDate: returnLocal.date
        ? toUtcIso(returnLocal.date, returnLocal.time || DEFAULT_RETURN_TIME)
        : "",
    });
  }

  function updateReturnTime(time: string) {
    if (!returnLocal.date) return;
    if (
      isTimeDisabled({
        mode: "return",
        date: returnLocal.date,
        time,
        pickupDate: pickupLocal.date,
        returnDate: returnLocal.date,
        blockedIntervals,
        turnaroundBufferHours,
      })
    ) {
      return;
    }

    onChange({
      pickupDate: pickupLocal.date
        ? toUtcIso(pickupLocal.date, pickupLocal.time || DEFAULT_PICKUP_TIME)
        : "",
      returnDate: toUtcIso(returnLocal.date, time),
    });
  }

  return (
    <div className="rounded-[1.25rem] border border-neutral-200 bg-[#FAFAFA] p-4">
      <button
        type="button"
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 rounded-[1rem] border border-neutral-200 bg-white p-4 text-left transition-all hover:border-neutral-400 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[var(--nx-accent)]"
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-950 text-white">
            <CalendarDays className="h-4 w-4" />
          </span>
          <span>
            <span className="block text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
              Date and time
            </span>
            <span className="mt-1 block text-sm font-semibold text-neutral-950">
              {pickupLocal.date && returnLocal.date
                ? `${formatDateTime(pickupDate)} - ${formatDateTime(returnDate)}`
                : "Select pickup and return"}
            </span>
            <span className="mt-1 block text-xs font-light text-neutral-500">
              Estimated by 24h blocks, with a 3h grace window.
            </span>
          </span>
        </span>
        <span className="shrink-0 rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700">
          {hasDates ? "Dates selected" : "Choose"}
        </span>
      </button>

      {isOpen && (
        <div className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                Calendar estimate
              </p>
              <p className="mt-1 text-sm font-light leading-5 text-neutral-600">
                Estimated daily rate. Final total and deposit are confirmed
                before payment.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Show previous month"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-800 transition-colors hover:border-neutral-400 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[var(--nx-accent)]"
                onClick={() => setVisibleMonth(addMonths(visibleMonth, -1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Show next month"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-800 transition-colors hover:border-neutral-400 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[var(--nx-accent)]"
                onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <TimeField
              disabled={!pickupLocal.date}
              label="Pickup time"
              value={pickupLocal.time || DEFAULT_PICKUP_TIME}
              isOptionDisabled={(time) =>
                isTimeDisabled({
                  mode: "pickup",
                  date: pickupLocal.date,
                  time,
                  pickupDate: pickupLocal.date,
                  returnDate: returnLocal.date,
                  blockedIntervals,
                  turnaroundBufferHours,
                })
              }
              onChange={updatePickupTime}
            />
            <TimeField
              disabled={!returnLocal.date}
              label="Return time"
              value={returnLocal.time || DEFAULT_RETURN_TIME}
              isOptionDisabled={(time) =>
                isTimeDisabled({
                  mode: "return",
                  date: returnLocal.date,
                  time,
                  pickupDate: pickupLocal.date,
                  returnDate: returnLocal.date,
                  blockedIntervals,
                  turnaroundBufferHours,
                })
              }
              onChange={updateReturnTime}
            />
          </div>

          {availabilityError && (
            <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
              {availabilityError}
            </p>
          )}

          <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
              Trip period
            </p>
            {pickupLocal.date && returnLocal.date ? (
              <>
                <p className="mt-2 text-sm font-semibold text-neutral-950">
                  {formatDateTime(pickupDate)} - {formatDateTime(returnDate)}
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <span className="rounded-xl bg-neutral-50 px-3 py-2 text-xs font-semibold text-neutral-700">
                    {formatDateTime(pickupDate)} - {formatDateTime(returnDate)}
                  </span>
                  <span className="rounded-xl bg-[#1E41FC]/10 px-3 py-2 text-xs font-semibold text-[#1E41FC]">
                    Dates selected
                  </span>
                </div>
                <p className="mt-3 text-xs font-light leading-5 text-neutral-500">
                  Final total calculated after selection.
                </p>
              </>
            ) : pickupLocal.date ? (
              <p className="mt-2 text-sm font-light text-neutral-600">
                Pickup selected. Choose a return date and time to calculate the
                estimate.
              </p>
            ) : (
              <p className="mt-2 text-sm font-light text-neutral-600">
                Choose pickup first, then return. The calendar stays closed
                until you need it.
              </p>
            )}
          </div>

          <div
            aria-describedby={[pickupErrorId, returnErrorId]
              .filter(Boolean)
              .join(" ") || undefined}
            aria-label="Select pickup and return dates"
            className="mt-5"
            role="group"
          >
            <div className="mb-3 text-center font-display text-lg font-semibold text-neutral-950">
              {monthFormatter.format(visibleMonth)}
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {Array.from({ length: 7 }, (_, index) => {
                const date = new Date(2026, 5, 7 + index);
                return (
                  <div
                    key={index}
                    className="py-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-500"
                  >
                    {dayFormatter.format(date)}
                  </div>
                );
              })}
              {days.map((day) => {
                const isPickup = day.date === pickupLocal.date;
                const isReturn = day.date === returnLocal.date;
                const isInRange =
                  Boolean(pickupLocal.date && returnLocal.date) &&
                  day.date > pickupLocal.date &&
                  day.date < returnLocal.date;
                const isPreviewRange =
                  Boolean(pickupLocal.date && !returnLocal.date && hoveredDate) &&
                  day.date > pickupLocal.date &&
                  hoveredDate !== null &&
                  day.date < hoveredDate;
                const isPreviewEnd =
                  Boolean(pickupLocal.date && !returnLocal.date) &&
                  day.date === hoveredDate &&
                  day.date > pickupLocal.date;
                const isSelected = isPickup || isReturn;
                const isExtraChargeDay =
                  extraChargeDate === day.date && isExtraBilling(quotePricing?.extraBillingType);

                return (
                  <button
                    key={day.date}
                    type="button"
                    aria-label={getDayAriaLabel({
                      day,
                      isPickup,
                      isReturn,
                      isInRange,
                      isPreviewEnd,
                    })}
                    aria-pressed={isSelected}
                    disabled={!day.available}
                    onClick={() => selectDate(day.date)}
                    onMouseEnter={() => setHoveredDate(day.date)}
                    onMouseLeave={() => setHoveredDate(null)}
                    onFocus={() => setHoveredDate(day.date)}
                    onBlur={() => setHoveredDate(null)}
                    className={[
                      "min-h-[4.4rem] rounded-xl border p-2 text-left transition-all focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--nx-accent)]",
                      getDayClassName(day),
                      isInRange
                        ? "!border-[#9BB2FF] !bg-[#EAF0FF] !text-[#102A8C]"
                        : "",
                      isPreviewRange
                        ? "!border-[#B8C7FF] !bg-[#F3F6FF] !text-[#102A8C]"
                        : "",
                      isPreviewEnd
                        ? "!border-[#1E41FC] !bg-[#EAF0FF] !text-[#102A8C] ring-2 ring-[#1E41FC]/15"
                        : "",
                      isSelected
                        ? "!border-[#1E41FC] !bg-[#1E41FC] !text-white ring-2 ring-[#1E41FC]/25"
                        : "",
                      isExtraChargeDay
                        ? "!border-emerald-500 !bg-emerald-500 !text-white ring-2 ring-emerald-500/25"
                        : "",
                    ].join(" ")}
                  >
                    <span className="block text-sm font-semibold">
                      {new Date(`${day.date}T00:00:00`).getDate()}
                    </span>
                    {day.available && (
                      <span
                        className={[
                          "mt-2 block text-[10px] font-semibold leading-tight",
                          isSelected || isExtraChargeDay
                            ? "text-white/85"
                            : isInRange || isPreviewRange || isPreviewEnd
                              ? "text-[#2347D9]"
                              : "text-neutral-700",
                        ].join(" ")}
                        >
                        {priceFormatter.format(day.pricePerDayEurCents / 100)}
                      </span>
                    )}
                    {(isInRange || isPreviewRange) && !isExtraChargeDay && (
                      <span className="mt-1 block text-[9px] font-bold uppercase tracking-wider text-[#2347D9]">
                        Trip day
                      </span>
                    )}
                    {day.availabilityStatus === "PARTIAL" && !isSelected && (
                      <span className="mt-1 block text-[9px] font-bold uppercase tracking-wider text-amber-700">
                        Limited
                      </span>
                    )}
                    {isExtraChargeDay && (
                      <span
                        className={[
                          "mt-1 block text-[9px] font-bold uppercase tracking-wider",
                          isSelected ? "text-white/85" : "text-emerald-700",
                        ].join(" ")}
                      >
                        Extra time
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 grid gap-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-500 sm:grid-cols-4">
              <LegendDot className="bg-[#1E41FC]" label="Selected" />
              <LegendDot className="bg-emerald-100 ring-1 ring-emerald-300" label="Extra billed time" />
              <LegendDot className="bg-amber-100 ring-1 ring-amber-300" label="Limited hours" />
              <LegendDot className="bg-neutral-200" label="Unavailable" />
            </div>
          </div>
        </div>
      )}

      {(pickupError || returnError) && (
        <div className="mt-3 space-y-1">
          {pickupError && (
            <p className="text-xs font-medium text-red-600" id={pickupErrorId} role="alert">
              {pickupError}
            </p>
          )}
          {returnError && (
            <p className="text-xs font-medium text-red-600" id={returnErrorId} role="alert">
              {returnError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function TimeField({
  label,
  value,
  disabled,
  isOptionDisabled,
  onChange,
}: {
  label: string;
  value: string;
  disabled: boolean;
  isOptionDisabled?: (value: string) => boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
        {label}
      </span>
      <Select disabled={disabled} value={value} onValueChange={onChange}>
        <SelectTrigger
          className="min-h-12 rounded-[1rem] border-neutral-200 bg-white px-3 text-left text-sm font-bold text-neutral-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all hover:border-neutral-400 hover:bg-neutral-50 focus:ring-4 focus:ring-[#1E41FC]/15 [&>span]:flex [&>span]:items-center [&>span]:gap-3"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-white shadow-sm">
            <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />
          </span>
          <SelectValue placeholder="Select time" />
        </SelectTrigger>
        <SelectContent
          className="rounded-[1rem] border-neutral-200 bg-white p-2 shadow-2xl"
          position="popper"
        >
          {TIME_OPTIONS.map((time) => {
            const optionDisabled = isOptionDisabled?.(time) ?? false;
            return (
              <SelectItem
                className="rounded-xl px-3 py-2 text-sm font-semibold data-[disabled]:cursor-not-allowed data-[disabled]:opacity-100 data-[disabled]:text-neutral-400 focus:bg-[#1E41FC]/10 focus:text-neutral-950"
                disabled={optionDisabled}
                key={time}
                value={time}
              >
                <span className="flex min-w-[12rem] items-center justify-between gap-4">
                  <span>{time}</span>
                  {optionDisabled && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Unavailable
                    </span>
                  )}
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </label>
  );
}

function buildCalendarDays(
  month: Date,
  today: Date,
  basePricePerDayEurCents: number,
  availabilityCalendar: VehicleAvailabilityCalendar | null,
): CalendarDayPrice[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  const availabilityByDate = new Map(
    availabilityCalendar?.days.map((day) => [day.date, day]) ?? [],
  );

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const iso = toIsoDate(date);
    const liveDay = availabilityByDate.get(iso);
    const isPast = startOfDay(date) < today;
    const availabilityStatus = isPast
      ? "PAST"
      : liveDay?.status ?? "AVAILABLE";

    return {
      date: iso,
      available: availabilityStatus !== "PAST" && availabilityStatus !== "UNAVAILABLE",
      availabilityStatus,
      pricePerDayEurCents:
        liveDay?.pricePerDayEurCents ?? basePricePerDayEurCents,
      priceSource: liveDay ? "backend-calendar" : "base-rate",
    };
  });
}

function getDayAriaLabel({
  day,
  isPickup,
  isReturn,
  isInRange,
  isPreviewEnd,
}: {
  day: CalendarDayPrice;
  isPickup: boolean;
  isReturn: boolean;
  isInRange: boolean;
  isPreviewEnd: boolean;
}): string {
  const dateLabel = longDateFormatter.format(parseIsoDate(day.date));
  if (!day.available) {
    return day.availabilityStatus === "PAST"
      ? `${dateLabel}, unavailable because it is in the past.`
      : `${dateLabel}, unavailable because this vehicle is already reserved.`;
  }

  const rateLabel = `${priceFormatter.format(
    day.pricePerDayEurCents / 100,
  )} estimated daily rate.`;

  if (isPickup) return `${dateLabel}, pickup date selected. ${rateLabel}`;
  if (isReturn) return `${dateLabel}, return date selected. ${rateLabel}`;
  if (isInRange) return `${dateLabel}, inside selected rental period. ${rateLabel}`;
  if (isPreviewEnd) return `${dateLabel}, preview return date. ${rateLabel}`;
  if (day.availabilityStatus === "PARTIAL") {
    return `${dateLabel}, partially available. Choose an available time. ${rateLabel}`;
  }
  return `${dateLabel}, available. ${rateLabel}`;
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={["h-2.5 w-2.5 rounded-full", className].join(" ")} />
      {label}
    </span>
  );
}

function getDayClassName(day: CalendarDayPrice): string {
  if (!day.available) {
    if (day.availabilityStatus === "UNAVAILABLE") {
      return "cursor-not-allowed border-red-200 bg-red-50 text-red-300";
    }

    return "cursor-not-allowed border-neutral-100 bg-neutral-100 text-neutral-300";
  }

  if (day.availabilityStatus === "PARTIAL") {
    return "border-amber-200 bg-amber-50 text-neutral-950 hover:border-amber-400";
  }

  return "border-neutral-200 bg-white hover:border-neutral-400";
}

function getVisibleCalendarRange(month: Date): { from: string; to: string } {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  const end = new Date(start);
  end.setDate(start.getDate() + 41);

  return { from: toIsoDate(start), to: toIsoDate(end) };
}

function getExtraChargeDate(
  pickupDate: string,
  quotePricing?: Pick<
    PricingQuote,
    "extraBillingType" | "extraHours" | "fullDays"
  > | null,
): string | null {
  if (!pickupDate || !quotePricing || !isExtraBilling(quotePricing.extraBillingType)) {
    return null;
  }

  const pickup = new Date(pickupDate);
  if (Number.isNaN(pickup.getTime())) return null;

  const extraStart = new Date(
    pickup.getTime() + quotePricing.fullDays * 24 * 60 * 60 * 1000,
  );
  return toIsoDate(extraStart);
}

function isExtraBilling(type?: ExtraBillingType): boolean {
  return type === "HALF_DAY" || type === "FULL_DAY";
}

function isTimeDisabled(input: {
  mode: "pickup" | "return";
  date: string;
  time: string;
  pickupDate: string;
  returnDate: string;
  blockedIntervals: VehicleAvailabilityCalendar["blockedIntervals"];
  turnaroundBufferHours: number;
}): boolean {
  if (!input.date) return false;

  const candidate = toLocalDate(input.date, input.time);
  if (Number.isNaN(candidate.getTime())) return true;

  if (input.mode === "pickup") {
    if (!input.returnDate) {
      return isInstantInsideBlockedInterval(candidate, input.blockedIntervals);
    }

    const returnValue = parseLocalValue(input.returnDate);
    const requestedReturn = toLocalDate(
      returnValue.date,
      returnValue.time || DEFAULT_RETURN_TIME,
    );

    return (
      requestedReturn <= candidate ||
      hasBufferedIntervalConflict(
        candidate,
        requestedReturn,
        input.blockedIntervals,
        input.turnaroundBufferHours,
      )
    );
  }

  if (!input.pickupDate) {
    return isInstantInsideBlockedInterval(candidate, input.blockedIntervals);
  }

  const pickupValue = parseLocalValue(input.pickupDate);
  const requestedPickup = toLocalDate(
    pickupValue.date,
    pickupValue.time || DEFAULT_PICKUP_TIME,
  );

  return (
    candidate <= requestedPickup ||
    hasBufferedIntervalConflict(
      requestedPickup,
      candidate,
      input.blockedIntervals,
      input.turnaroundBufferHours,
    )
  );
}

function getFirstAvailableTime(input: {
  mode: "pickup" | "return";
  date: string;
  pickupDate: string;
  returnDate: string;
  blockedIntervals: VehicleAvailabilityCalendar["blockedIntervals"];
  turnaroundBufferHours: number;
}): string | null {
  return (
    TIME_OPTIONS.find(
      (time) =>
        !isTimeDisabled({
          ...input,
          time,
        }),
    ) ?? null
  );
}

function hasBufferedIntervalConflict(
  requestedPickup: Date,
  requestedReturn: Date,
  blockedIntervals: VehicleAvailabilityCalendar["blockedIntervals"],
  turnaroundBufferHours: number,
): boolean {
  const requestedStart = requestedPickup.getTime();
  const requestedEndWithBuffer =
    requestedReturn.getTime() + turnaroundBufferHours * 60 * 60 * 1000;

  return blockedIntervals.some((interval) => {
    const blockedStart = new Date(interval.startAt).getTime();
    const blockedEndWithBuffer = new Date(interval.bufferedEndAt).getTime();

    return blockedStart < requestedEndWithBuffer && blockedEndWithBuffer > requestedStart;
  });
}

function isInstantInsideBlockedInterval(
  instant: Date,
  blockedIntervals: VehicleAvailabilityCalendar["blockedIntervals"],
): boolean {
  const time = instant.getTime();
  return blockedIntervals.some((interval) => {
    const blockedStart = new Date(interval.startAt).getTime();
    const blockedEndWithBuffer = new Date(interval.bufferedEndAt).getTime();
    return time >= blockedStart && time < blockedEndWithBuffer;
  });
}

function toLocalDate(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`);
}

function parseLocalValue(value: string): { date: string; time: string } {
  if (!value) return { date: "", time: "" };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: "", time: "" };
  return {
    date: toIsoDate(date),
    time: `${String(date.getHours()).padStart(2, "0")}:${String(
      date.getMinutes(),
    ).padStart(2, "0")}`,
  };
}

function toUtcIso(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString();
}

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function parseIsoDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function toIsoDate(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

