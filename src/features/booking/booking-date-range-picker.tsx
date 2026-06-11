"use client";

import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type CalendarDayPrice = {
  date: string;
  available: boolean;
  pricePerDayEurCents: number;
  priceSource: "base-rate" | "backend-calendar" | "dynamic";
};

type BookingDateRangePickerProps = {
  pickupDate: string;
  returnDate: string;
  basePricePerDayEurCents: number;
  onChange: (range: { pickupDate: string; returnDate: string }) => void;
  pickupError?: string;
  returnError?: string;
  pickupErrorId?: string;
  returnErrorId?: string;
};

const DEFAULT_PICKUP_TIME = "10:00";
const DEFAULT_RETURN_TIME = "10:00";
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
  pickupDate,
  returnDate,
  basePricePerDayEurCents,
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
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const days = buildCalendarDays(visibleMonth, today, basePricePerDayEurCents);
  const hasDates = Boolean(pickupLocal.date && returnLocal.date);
  // Removed





  function selectDate(date: string) {
    if (
      !pickupLocal.date ||
      (pickupLocal.date && returnLocal.date) ||
      date <= pickupLocal.date
    ) {
      onChange({
        pickupDate: toUtcIso(date, pickupLocal.time || DEFAULT_PICKUP_TIME),
        returnDate: "",
      });
      setHoveredDate(null);
      return;
    }

    onChange({
      pickupDate: toUtcIso(
        pickupLocal.date,
        pickupLocal.time || DEFAULT_PICKUP_TIME,
      ),
      returnDate: toUtcIso(date, returnLocal.time || DEFAULT_RETURN_TIME),
    });
    setHoveredDate(null);
  }

  function updatePickupTime(time: string) {
    if (!pickupLocal.date) return;
    onChange({
      pickupDate: toUtcIso(pickupLocal.date, time),
      returnDate: returnLocal.date
        ? toUtcIso(returnLocal.date, returnLocal.time || DEFAULT_RETURN_TIME)
        : "",
    });
  }

  function updateReturnTime(time: string) {
    if (!returnLocal.date) return;
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
              onChange={updatePickupTime}
            />
            <TimeField
              disabled={!returnLocal.date}
              label="Return time"
              value={returnLocal.time || DEFAULT_RETURN_TIME}
              onChange={updateReturnTime}
            />
          </div>

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
                      day.available
                        ? "border-neutral-200 bg-white hover:border-neutral-400"
                        : "cursor-not-allowed border-neutral-100 bg-neutral-100 text-neutral-300",
                      isInRange
                        ? "border-[#9BB2FF] bg-[#EAF0FF] text-neutral-950"
                        : "",
                      isPreviewRange
                        ? "border-[#B8C7FF] bg-[#F3F6FF] text-neutral-950"
                        : "",
                      isPreviewEnd
                        ? "border-[#1E41FC] bg-[#EAF0FF] text-neutral-950 ring-2 ring-[#1E41FC]/15"
                        : "",
                      isSelected
                        ? "!border-[#1E41FC] !bg-[#1E41FC] !text-white ring-2 ring-[#1E41FC]/25"
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
                          isSelected ? "text-white/85" : "text-neutral-700",
                        ].join(" ")}
                      >
                        {priceFormatter.format(day.pricePerDayEurCents / 100)}
                      </span>
                    )}
                  </button>
                );
              })}
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
  onChange,
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
        {label}
      </span>
      <Select disabled={disabled} value={value} onValueChange={onChange}>
        <SelectTrigger className="min-h-11 rounded-xl border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-900 outline-none transition-all focus:border-[#1E41FC] focus:ring-2 focus:ring-[#1E41FC]/10 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400">
          <SelectValue placeholder="Select time" />
        </SelectTrigger>
        <SelectContent>
          {TIME_OPTIONS.map((time) => (
            <SelectItem key={time} value={time}>
              {time}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}

function buildCalendarDays(
  month: Date,
  today: Date,
  basePricePerDayEurCents: number,
): CalendarDayPrice[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const iso = toIsoDate(date);

    return {
      date: iso,
      available: startOfDay(date) >= today,
      pricePerDayEurCents: basePricePerDayEurCents,
      priceSource: "base-rate",
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
    return `${dateLabel}, unavailable because it is in the past.`;
  }

  const rateLabel = `${priceFormatter.format(
    day.pricePerDayEurCents / 100,
  )} estimated daily rate.`;

  if (isPickup) return `${dateLabel}, pickup date selected. ${rateLabel}`;
  if (isReturn) return `${dateLabel}, return date selected. ${rateLabel}`;
  if (isInRange) return `${dateLabel}, inside selected rental period. ${rateLabel}`;
  if (isPreviewEnd) return `${dateLabel}, preview return date. ${rateLabel}`;
  return `${dateLabel}, available. ${rateLabel}`;
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

