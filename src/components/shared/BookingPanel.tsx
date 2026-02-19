"use client";

import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowRight, MapPin, Minus, Plus, Calendar, ChevronRight } from "lucide-react";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import Price from "@/components/shared/Price";
import { useBookingStore } from "@/stores/useBookingStore";
import { PICKUP_LOCATION_LABELS, DEPOSIT_AMOUNT_EUR } from "@/lib/constants";
import type { PickupLocation } from "@/types";

//  Constants 

const LOCATIONS: PickupLocation[] = ["CMN_T1", "CMN_T2"];
const MIN_DAYS = 1;
const MAX_DAYS = 30;
const DEFAULT_PRICE_PER_DAY = 160; // EUR, shown before vehicle selection

//  Stepper button 

function Stepper({
  value,
  min,
  max,
  onChange,
  label,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider">
        {label}
      </span>
      <div className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl px-2 py-2">
        <button
          type="button"
          aria-label="Menos días"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-11 h-11 rounded-lg flex items-center justify-center
                     bg-white border border-slate-200 text-brand-dark shadow-sm
                     hover:bg-brand-primary hover:text-white hover:border-brand-primary
                     disabled:opacity-30 disabled:cursor-not-allowed
                     transition-all active:scale-95"
        >
          <Minus className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center flex-1">
          <span className="text-2xl font-black text-brand-dark leading-none tabular-nums">
            {value}
          </span>
          <span className="text-[11px] text-brand-muted mt-0.5">
            {value === 1 ? "día" : "días"}
          </span>
        </div>

        <button
          type="button"
          aria-label="Más días"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-11 h-11 rounded-lg flex items-center justify-center
                     bg-white border border-slate-200 text-brand-dark shadow-sm
                     hover:bg-brand-primary hover:text-white hover:border-brand-primary
                     disabled:opacity-30 disabled:cursor-not-allowed
                     transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Quick pills */}
      <div className="flex gap-1.5 flex-wrap">
        {[3, 7, 14].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => onChange(d)}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
              value === d
                ? "bg-brand-primary text-white border-brand-primary"
                : "bg-white text-brand-muted border-slate-200 hover:border-brand-primary hover:text-brand-primary"
            }`}
          >
            {d} días
          </button>
        ))}
      </div>
    </div>
  );
}

//  Step 1: Location + Date + Duration 

function StepDates({ onNext }: { onNext: () => void }) {
  const { pickupLocation, setDates, setLocation } = useBookingStore();

  // Local state  sync to store on "next"
  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  }, []);

  const [arrivalDate, setArrivalDate] = useState(todayStr);
  const [days, setDays] = useState(3);

  const totalPrice = days * DEFAULT_PRICE_PER_DAY;

  const returnDateLabel = useMemo(() => {
    const base = new Date(arrivalDate + "T12:00:00");
    return format(addDays(base, days), "d MMM yyyy", { locale: es });
  }, [arrivalDate, days]);

  const arrivalDateLabel = useMemo(() => {
    const base = new Date(arrivalDate + "T12:00:00");
    return format(base, "d MMM yyyy", { locale: es });
  }, [arrivalDate]);

  function handleNext() {
    const pickup = new Date(arrivalDate + "T12:00:00");
    const ret = addDays(pickup, days);
    setDates(pickup.getTime(), ret.getTime());
    onNext();
  }

  return (
    <div className="flex flex-col gap-5">
      {/* 1  Terminal */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider">
          Terminal de recogida
        </span>
        <div className="grid grid-cols-2 gap-2">
          {LOCATIONS.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => setLocation(loc)}
              className={`min-h-[48px] px-3 py-3 rounded-xl text-sm font-bold border transition-all flex items-center justify-center gap-2 ${
                pickupLocation === loc
                  ? "bg-brand-primary text-white border-brand-primary shadow-sm"
                  : "bg-slate-50 text-brand-muted border-slate-200 hover:border-brand-primary hover:text-brand-dark"
              }`}
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              {PICKUP_LOCATION_LABELS[loc]}
            </button>
          ))}
        </div>
      </div>

      {/* 2  Arrival date */}
      <div className="flex flex-col gap-2">
        <label htmlFor="arrival" className="text-xs font-semibold text-brand-muted uppercase tracking-wider">
          Fecha de llegada
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted pointer-events-none" />
          <input
            id="arrival"
            type="date"
            value={arrivalDate}
            min={todayStr}
            onChange={(e) => setArrivalDate(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white
                       text-brand-dark font-semibold text-sm
                       focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary
                       transition-all cursor-pointer"
          />
        </div>
      </div>

      {/* 3  Days stepper */}
      <Stepper
        value={days}
        min={MIN_DAYS}
        max={MAX_DAYS}
        onChange={setDays}
        label="¿Cuántos días necesitas?"
      />

      {/* 4  Summary bar */}
      <div className="bg-brand-primary/5 border border-brand-primary/15 rounded-xl p-4 flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5 text-xs text-brand-muted leading-snug min-w-0">
          <span>
            <span className="font-semibold text-brand-dark">{arrivalDateLabel}</span>
            {"  "}
            <span className="font-semibold text-brand-dark">{returnDateLabel}</span>
          </span>
          <span>{days} {days === 1 ? "día" : "días"} · desde {DEFAULT_PRICE_PER_DAY}€/día</span>
        </div>
        <div className="shrink-0 text-right">
          <Price amount={totalPrice} size="md" animated className="text-brand-dark" />
          <p className="text-[10px] text-brand-muted">estimado</p>
        </div>
      </div>

      {/* 5  CTA */}
      <button
        type="button"
        onClick={handleNext}
        className="w-full min-h-[54px] bg-brand-primary text-white font-bold text-sm rounded-full
                   flex items-center justify-center gap-2
                   hover:bg-brand-primary-hover active:scale-[0.98]
                   shadow-[0_4px_20px_rgba(37,99,235,0.28)] hover:shadow-[0_6px_28px_rgba(37,99,235,0.38)]
                   transition-all duration-200"
      >
        Ver coches disponibles
        <ArrowRight className="w-4 h-4" />
      </button>

      {/* Deposit note */}
      <p className="text-center text-[11px] text-brand-muted">
        Solo <span className="text-brand-dark font-semibold">10€</span> para confirmar · Resto al recoger
      </p>
    </div>
  );
}

//  Step 2: Confirmation 

function StepConfirm({ onBack }: { onBack: () => void }) {
  const { totalDays, pickupLocation, pickupDate, returnDate } = useBookingStore();
  const router = useRouter();

  const estimatedTotal = totalDays ? totalDays * DEFAULT_PRICE_PER_DAY : null;

  const fmt = (ts: number | null) => {
    if (!ts) return "";
    return format(new Date(ts), "d MMM yyyy", { locale: es });
  };

  const rows = [
    { label: "Terminal", value: PICKUP_LOCATION_LABELS[pickupLocation] },
    { label: "Llegada", value: fmt(pickupDate) },
    { label: "Salida", value: fmt(returnDate) },
    { label: "Duración", value: `${totalDays} ${totalDays === 1 ? "día" : "días"}` },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Summary card */}
      <div className="rounded-xl bg-slate-50 border border-slate-100 divide-y divide-slate-100 overflow-hidden">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between items-center px-4 py-3 text-sm">
            <span className="text-brand-muted">{r.label}</span>
            <span className="font-semibold text-brand-dark">{r.value}</span>
          </div>
        ))}
        {estimatedTotal && (
          <div className="flex justify-between items-center px-4 py-3">
            <span className="font-semibold text-brand-dark text-sm">Total estimado</span>
            <Price amount={estimatedTotal} size="md" animated className="text-brand-dark" />
          </div>
        )}
      </div>

      {/* Deposit highlight */}
      <div className="flex items-center gap-3 bg-brand-primary/5 border border-brand-primary/15 rounded-xl p-4">
        <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center shrink-0">
          <span className="text-white font-black text-sm">€</span>
        </div>
        <div>
          <p className="text-sm font-bold text-brand-dark">Pagas ahora: 10€</p>
          <p className="text-xs text-brand-muted">El resto lo abonas al recoger el vehículo</p>
        </div>
      </div>

      {/* CTA */}
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
         Cambiar fechas
      </button>
    </div>
  );
}

//  Step indicator 

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

//  Main export 

const stepVariants = {
  enter: { opacity: 0, x: 16 },
  center: { opacity: 1, x: 0, transition: { duration: 0.2, ease: "easeOut" as const } },
  exit: { opacity: 0, x: -16, transition: { duration: 0.15, ease: "easeIn" as const } },
};

const STEP_TITLES: Record<number, string> = {
  1: "Reserva tu coche",
  2: "Confirmar reserva",
};

export default function BookingPanel() {
  const [step, setStep] = useState(1);

  return (
    <motion.div
      className="bg-white border border-slate-200 shadow-xl rounded-2xl p-5 md:p-6 lg:sticky lg:top-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-brand-muted font-medium">
            CMN · Aeropuerto Mohammed V
          </p>
          <h3 className="text-base font-bold text-brand-dark mt-0.5">
            {STEP_TITLES[step]}
          </h3>
        </div>
        <StepDots current={step} />
      </div>

      {/* Steps */}
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
