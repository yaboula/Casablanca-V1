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
  MapPin,
  Check,
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
  { length: 48 },
  (_, i) => {
    const h = Math.floor(i / 2);
    const m = i % 2 === 0 ? "00" : "30";
    return `${String(h).padStart(2, "0")}:${m}`;
  }
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

            {/* Time selector — custom popover */}
            <TimeSelect value={time} onChange={onTimeChange} />
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
        </PopoverContent>
      </Popover>
    </div>
  );
}

// ── TerminalSelect ──────────────────────────────────────────────────────────

const TERMINAL_META: Record<PickupLocation, { title: string; sub: string }> = {
  CMN_T1: { title: "Terminal 1", sub: "Vuelos nacionales · Lanzadera incluida" },
  CMN_T2: { title: "Terminal 2", sub: "Vuelos internacionales · Zona de llegadas" },
};

function TerminalSelect({
  value,
  onChange,
}: {
  value: PickupLocation;
  onChange: (v: PickupLocation) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-full h-12 flex items-center gap-3 px-4 rounded-2xl border border-slate-200
                     bg-white text-sm font-semibold text-brand-dark text-left
                     hover:border-brand-primary/50 hover:shadow-sm
                     focus:outline-none focus:ring-2 focus:ring-brand-primary/25 focus:border-brand-primary
                     transition-all duration-150"
        >
          <MapPin className="w-4 h-4 text-brand-primary shrink-0" />
          <span className="flex-1 truncate">CMN · {TERMINAL_META[value].title}</span>
          <ChevronDown className={`w-4 h-4 text-brand-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 p-2 rounded-2xl shadow-2xl border border-slate-100"
        align="start"
        sideOffset={8}
      >
        <p className="text-[10px] uppercase tracking-wider text-brand-muted font-semibold px-2 pb-2">
          Elige tu terminal en CMN
        </p>
        {LOCATIONS.map((loc) => {
          const active = loc === value;
          return (
            <button
              key={loc}
              type="button"
              onClick={() => { onChange(loc); setOpen(false); }}
              className={`w-full flex items-start gap-3 px-3 py-3 rounded-xl transition-all text-left
                ${
                  active
                    ? "bg-brand-primary/8 border border-brand-primary/20"
                    : "hover:bg-slate-50 border border-transparent"
                }`}
            >
              <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                ${ active ? "bg-brand-primary" : "bg-slate-100" }`}
              >
                <MapPin className={`w-4 h-4 ${ active ? "text-white" : "text-brand-muted" }`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold ${ active ? "text-brand-primary" : "text-brand-dark" }`}>
                  {TERMINAL_META[loc].title}
                </p>
                <p className="text-xs text-brand-muted mt-0.5 leading-tight">{TERMINAL_META[loc].sub}</p>
              </div>
              {active && <Check className="w-4 h-4 text-brand-primary mt-1 shrink-0" />}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

// ── TimeSelect ────────────────────────────────────────────────────────────────

function TimeSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="flex-1 h-12 flex items-center justify-between gap-1.5 px-3 rounded-2xl
                     border border-slate-200 bg-white text-sm font-semibold text-brand-dark
                     hover:border-brand-primary/50 hover:shadow-sm
                     focus:outline-none focus:ring-2 focus:ring-brand-primary/25 focus:border-brand-primary
                     transition-all duration-150"
        >
          <Clock className="w-3.5 h-3.5 text-brand-muted shrink-0" />
          <span className="flex-1 text-left">{value}</span>
          <ChevronDown className={`w-3 h-3 text-brand-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-36 p-2 rounded-2xl shadow-2xl border border-slate-100"
        align="start"
        sideOffset={8}
      >
        <div className="max-h-56 overflow-y-auto flex flex-col gap-0.5
                        [scrollbar-width:thin] [scrollbar-color:#e2e8f0_transparent]">
          {HOURS.map((h) => {
            const active = h === value;
            return (
              <button
                key={h}
                type="button"
                onClick={() => { onChange(h); setOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold transition-all
                  ${
                    active
                      ? "bg-brand-primary text-white"
                      : "text-brand-dark hover:bg-slate-50"
                  }`}
              >
                <span>{h}</span>
                {active && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
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
        <TerminalSelect value={pickupLocation} onChange={setLocation} />
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
