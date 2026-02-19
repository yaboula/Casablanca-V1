"use client";

import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarIcon,
  ChevronDown,
  ChevronRight,
  Clock,
} from "lucide-react";
import {
  format,
  differenceInCalendarDays,
  addDays,
  isAfter,
  isBefore,
  startOfDay,
} from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useBookingStore } from "@/stores/useBookingStore";
import { PICKUP_LOCATION_LABELS } from "@/lib/constants";
import type { PickupLocation } from "@/types";

//  helpers 

const LOCATIONS: PickupLocation[] = ["CMN_T1", "CMN_T2"];
const HOURS = Array.from(
  { length: 24 },
  (_, i) => `${String(i).padStart(2, "0")}:00`
);

function buildDate(date: Date, timeStr: string) {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

//  DateTimeField 

interface DateTimeFieldProps {
  label: string;
  date: Date | undefined;
  time: string;
  onDateChange: (d: Date) => void;
  onTimeChange: (t: string) => void;
  disabledBefore?: Date;
  defaultMonth?: Date;
}

function DateTimeField({
  label,
  date,
  time,
  onDateChange,
  onTimeChange,
  disabledBefore,
  defaultMonth,
}: DateTimeFieldProps) {
  const [open, setOpen] = useState(false);

  const displayText = date
    ? format(date, "dd MMM yyyy", { locale: es })
    : "Seleccionar fecha";

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider">
        {label}
      </span>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="flex items-center gap-2">
            {/* Date trigger button */}
            <button
              type="button"
              className="flex items-center gap-2.5 flex-[2] h-12 px-4 rounded-2xl border border-slate-200
                         bg-white text-sm font-semibold text-brand-dark text-left
                         hover:border-brand-primary/50 hover:shadow-sm
                         focus:outline-none focus:ring-2 focus:ring-brand-primary/25 focus:border-brand-primary
                         transition-all duration-150"
            >
              <CalendarIcon className="w-4 h-4 text-brand-muted shrink-0" />
              <span className={date ? "text-brand-dark" : "text-brand-muted"}>
                {displayText}
              </span>
            </button>

            {/* Time selector */}
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                <Clock className="w-3.5 h-3.5 text-brand-muted" />
              </span>
              <select
                value={time}
                onChange={(e) => { e.stopPropagation(); onTimeChange(e.target.value); }}
                onClick={(e) => e.stopPropagation()}
                className="w-full h-12 pl-8 pr-2 rounded-2xl border border-slate-200 bg-white
                           text-sm font-semibold text-brand-dark appearance-none cursor-pointer
                           focus:outline-none focus:ring-2 focus:ring-brand-primary/25 focus:border-brand-primary
                           transition-all"
              >
                {HOURS.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-brand-muted" />
            </div>
          </div>
        </PopoverTrigger>

        {/* Calendar Popover */}
        <PopoverContent
          className="w-auto p-0 rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
          align="start"
          sideOffset={8}
        >
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => { if (d) { onDateChange(d); setOpen(false); } }}
            defaultMonth={defaultMonth ?? date ?? new Date()}
            disabled={(d) =>
              isBefore(startOfDay(d), startOfDay(disabledBefore ?? new Date()))
            }
            locale={es}
            className="p-4 [--cell-size:--spacing(10)]"
            classNames={{
              day_selected:
                "bg-brand-primary text-white hover:bg-brand-primary focus:bg-brand-primary rounded-full",
              day_today: "font-extrabold underline underline-offset-2",
              day: "rounded-full transition-colors",
            }}
          />

          {/* Hour grid inside popover */}
          <div className="px-4 pb-4 pt-1 border-t border-slate-100 bg-slate-50">
            <p className="text-[10px] uppercase tracking-wider text-brand-muted font-semibold mb-2">
              Hora de {label === "Fecha de recogida" ? "recogida" : "devolución"}
            </p>
            <div className="grid grid-cols-6 gap-1">
              {HOURS.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => onTimeChange(h)}
                  className={`text-xs font-semibold py-1.5 rounded-lg transition-all
                    ${
                      time === h
                        ? "bg-brand-primary text-white shadow-sm"
                        : "bg-white border border-slate-200 text-brand-dark hover:border-brand-primary/40 hover:text-brand-primary"
                    }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

//  Step 1: Dates 

function StepDates({ onNext }: { onNext: () => void }) {
  const { pickupLocation, setDates, setLocation } = useBookingStore();

  const today = startOfDay(new Date());

  const [pickupDate, setPickupDate] = useState<Date | undefined>(today);
  const [pickupTime, setPickupTime] = useState("12:00");
  const [returnDate, setReturnDate] = useState<Date | undefined>(addDays(today, 1));
  const [returnTime, setReturnTime] = useState("12:00");

  function handlePickupDateChange(d: Date) {
    setPickupDate(d);
    if (
      returnDate &&
      !isAfter(buildDate(returnDate, returnTime), buildDate(d, pickupTime))
    ) {
      setReturnDate(addDays(d, 1));
    }
  }

  const days = useMemo(() => {
    if (!pickupDate || !returnDate) return null;
    const d = differenceInCalendarDays(
      buildDate(returnDate, returnTime),
      buildDate(pickupDate, pickupTime)
    );
    return d > 0 ? d : null;
  }, [pickupDate, pickupTime, returnDate, returnTime]);

  function handleNext() {
    if (!pickupDate || !returnDate) return;
    setDates(
      buildDate(pickupDate, pickupTime).getTime(),
      buildDate(returnDate, returnTime).getTime()
    );
    onNext();
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Terminal */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider">
          Terminal de recogida
        </span>
        <div className="relative">
          <select
            value={pickupLocation}
            onChange={(e) => setLocation(e.target.value as PickupLocation)}
            className="w-full h-12 px-4 pr-10 rounded-2xl border border-slate-200 bg-white
                       text-sm font-semibold text-brand-dark appearance-none cursor-pointer
                       focus:outline-none focus:ring-2 focus:ring-brand-primary/25 focus:border-brand-primary
                       transition-all"
          >
            {LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>{PICKUP_LOCATION_LABELS[loc]}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
        </div>
      </div>

      {/* Pickup date + time */}
      <DateTimeField
        label="Fecha de recogida"
        date={pickupDate}
        time={pickupTime}
        onDateChange={handlePickupDateChange}
        onTimeChange={setPickupTime}
        disabledBefore={today}
      />

      {/* Return date + time */}
      <DateTimeField
        label="Fecha de devolución"
        date={returnDate}
        time={returnTime}
        onDateChange={setReturnDate}
        onTimeChange={setReturnTime}
        disabledBefore={pickupDate ? addDays(pickupDate, 1) : addDays(today, 1)}
        defaultMonth={pickupDate}
      />

      {/* Duration chip */}
      <AnimatePresence>
        {days && (
          <motion.div
            key="chip"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="flex items-center justify-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl py-3"
          >
            <span className="text-sm font-bold text-brand-dark">{days}</span>
            <span className="text-sm text-brand-muted">
              {days === 1 ? "día de alquiler" : "días de alquiler"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA */}
      <button
        type="button"
        onClick={handleNext}
        disabled={!days}
        className="w-full min-h-[54px] bg-brand-primary disabled:bg-slate-200 disabled:text-slate-400
                   text-white font-bold text-sm rounded-full
                   flex items-center justify-center gap-2
                   hover:bg-brand-primary-hover active:scale-[0.98]
                   shadow-[0_4px_20px_rgba(37,99,235,0.28)]
                   transition-all duration-200"
      >
        Buscar coches disponibles
        <ArrowRight className="w-4 h-4" />
      </button>

      <p className="text-center text-[11px] text-brand-muted">
        Solo <span className="text-brand-dark font-semibold">10€</span> para
        confirmar · El precio varía según el coche
      </p>
    </div>
  );
}

//  Step 2: Confirm 

function StepConfirm({ onBack }: { onBack: () => void }) {
  const { totalDays, pickupLocation, pickupDate, returnDate } = useBookingStore();
  const router = useRouter();

  const fmt = (ts: number | null) =>
    ts ? format(new Date(ts), "d MMM yyyy · HH:mm", { locale: es }) : "";

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl bg-slate-50 border border-slate-100 divide-y divide-slate-100 overflow-hidden">
        {[
          { label: "Terminal",   value: PICKUP_LOCATION_LABELS[pickupLocation] },
          { label: "Recogida",   value: fmt(pickupDate) },
          { label: "Devolución", value: fmt(returnDate) },
          { label: "Duración",   value: `${totalDays} ${totalDays === 1 ? "día" : "días"}` },
        ].map((r) => (
          <div key={r.label} className="flex justify-between items-center px-4 py-3 text-sm">
            <span className="text-brand-muted">{r.label}</span>
            <span className="font-semibold text-brand-dark text-right">{r.value}</span>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-3 bg-brand-primary/5 border border-brand-primary/15 rounded-2xl p-4">
        <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-white font-black text-xs">€</span>
        </div>
        <div>
          <p className="text-sm font-bold text-brand-dark">Pagas ahora: 10€</p>
          <p className="text-xs text-brand-muted mt-0.5">
            El precio exacto aparece al elegir el vehículo. El depósito se descuenta del total.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => router.push("/catalog")}
        className="w-full min-h-[54px] bg-brand-primary text-white font-bold text-sm rounded-full
                   flex items-center justify-center gap-2
                   hover:bg-brand-primary-hover active:scale-[0.98] transition-all"
      >
        Elegir mi coche
        <ChevronRight className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={onBack}
        className="text-xs text-brand-muted text-center hover:text-brand-dark transition-colors py-1"
      >
         Modificar fechas
      </button>
    </div>
  );
}

//  Step dots 

function StepDots({ current }: { current: number }) {
  return (
    <div className="flex gap-1.5">
      {[1, 2].map((n) => (
        <motion.div
          key={n}
          className="h-1.5 rounded-full"
          animate={{
            width: n === current ? 20 : 6,
            backgroundColor: n <= current ? "#2563EB" : "#E2E8F0",
          }}
          transition={{ duration: 0.25 }}
        />
      ))}
    </div>
  );
}

const stepVariants = {
  enter:  { opacity: 0, x: 16 },
  center: { opacity: 1, x: 0,   transition: { duration: 0.2,  ease: "easeOut" as const } },
  exit:   { opacity: 0, x: -16, transition: { duration: 0.15, ease: "easeIn"  as const } },
};

//  Main export 

export default function BookingPanel() {
  const [step, setStep] = useState(1);

  return (
    <motion.div
      className="bg-white border border-slate-200 shadow-xl rounded-2xl p-5 md:p-6 lg:sticky lg:top-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-brand-muted font-medium">
            CMN · Mohammed V
          </p>
          <h3 className="text-base font-bold text-brand-dark mt-0.5">
            {step === 1 ? "Reserva tu coche" : "Confirmar reserva"}
          </h3>
        </div>
        <StepDots current={step} />
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="s1" variants={stepVariants} initial="enter" animate="center" exit="exit">
            <StepDates onNext={() => setStep(2)} />
          </motion.div>
        )}
        {step === 2 && (
          <motion.div key="s2" variants={stepVariants} initial="enter" animate="center" exit="exit">
            <StepConfirm onBack={() => setStep(1)} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
