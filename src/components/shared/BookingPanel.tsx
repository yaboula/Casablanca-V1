"use client";

import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronRight, MapPin } from "lucide-react";
import { format, differenceInCalendarDays, addDays, isAfter, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useBookingStore } from "@/stores/useBookingStore";
import { PICKUP_LOCATION_LABELS } from "@/lib/constants";
import type { PickupLocation } from "@/types";

//  helpers 

const LOCATIONS: PickupLocation[] = ["CMN_T1", "CMN_T2"];

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

function fromStr(s: string): Date {
  return new Date(s + "T12:00:00");
}

//  DateField component 
// Native <input type="date"> styled to match brand.
// Shows a friendly formatted label above the raw input.

function DateField({
  id,
  label,
  value,
  min,
  max,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  min?: string;
  max?: string;
  onChange: (v: string) => void;
}) {
  const displayDate = useMemo(() => {
    if (!value) return null;
    return format(fromStr(value), "EEE d MMM", { locale: es });
  }, [value]);

  return (
    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
      <label htmlFor={id} className="text-xs font-semibold text-brand-muted uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        {/* Styled overlay  shows friendly date, hidden when input is focused */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-center px-4 rounded-xl bg-white border border-slate-200 z-[1]">
          {displayDate ? (
            <>
              <span className="text-[11px] text-brand-muted leading-none capitalize">
                {displayDate.split(" ").slice(0, 1).join("")}
              </span>
              <span className="text-sm font-bold text-brand-dark leading-tight">
                {displayDate.split(" ").slice(1).join(" ")}
              </span>
            </>
          ) : (
            <span className="text-sm text-brand-muted">Seleccionar</span>
          )}
        </div>
        {/* Real input  invisible but clickable on top */}
        <input
          id={id}
          type="date"
          value={value}
          min={min}
          max={max}
          onChange={(e) => onChange(e.target.value)}
          className="relative z-[2] w-full h-[58px] opacity-0 cursor-pointer"
        />
        {/* Border always visible below overlay */}
        <div className="absolute inset-0 rounded-xl border border-slate-200 pointer-events-none" />
      </div>
    </div>
  );
}

//  Step 1 

function StepDates({ onNext }: { onNext: () => void }) {
  const { pickupLocation, setDates, setLocation } = useBookingStore();

  const todayStr = toDateStr(new Date());
  const tomorrowStr = toDateStr(addDays(new Date(), 1));

  const [pickupStr, setPickupStr] = useState(todayStr);
  const [returnStr, setReturnStr] = useState(tomorrowStr);

  // Auto-correct: return must be after pickup
  function handlePickupChange(v: string) {
    setPickupStr(v);
    // If return is not after new pickup, push it forward by 1 day
    if (!isAfter(fromStr(returnStr), fromStr(v))) {
      setReturnStr(toDateStr(addDays(fromStr(v), 1)));
    }
  }

  const days = useMemo(() => {
    const d = differenceInCalendarDays(fromStr(returnStr), fromStr(pickupStr));
    return d > 0 ? d : 1;
  }, [pickupStr, returnStr]);

  const isValid = pickupStr && returnStr && isAfter(fromStr(returnStr), fromStr(pickupStr));

  function handleNext() {
    setDates(fromStr(pickupStr).getTime(), fromStr(returnStr).getTime());
    onNext();
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Terminal */}
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
              className={`min-h-[48px] rounded-xl text-sm font-bold border transition-all flex items-center justify-center gap-2 px-3
                ${pickupLocation === loc
                  ? "bg-brand-dark text-white border-brand-dark shadow-sm"
                  : "bg-white text-brand-muted border-slate-200 hover:border-brand-dark hover:text-brand-dark"
                }`}
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              {PICKUP_LOCATION_LABELS[loc]}
            </button>
          ))}
        </div>
      </div>

      {/* Dates  two side-by-side pickers */}
      <div className="flex gap-2">
        <DateField
          id="pickup"
          label="Recogida"
          value={pickupStr}
          min={todayStr}
          onChange={handlePickupChange}
        />
        <DateField
          id="returnd"
          label="Devolución"
          value={returnStr}
          min={toDateStr(addDays(fromStr(pickupStr), 1))}
          onChange={setReturnStr}
        />
      </div>

      {/* Duration chip  informative only, no price */}
      <div className="flex items-center justify-center gap-2 bg-slate-50 border border-slate-200 rounded-xl py-3">
        <span className="text-sm font-bold text-brand-dark tabular-nums">{days}</span>
        <span className="text-sm text-brand-muted">{days === 1 ? "día de alquiler" : "días de alquiler"}</span>
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={handleNext}
        disabled={!isValid}
        className="w-full min-h-[54px] bg-brand-primary disabled:bg-slate-200 disabled:text-slate-400
                   text-white font-bold text-sm rounded-full
                   flex items-center justify-center gap-2
                   hover:bg-brand-primary-hover active:scale-[0.98]
                   shadow-[0_4px_20px_rgba(37,99,235,0.28)] hover:shadow-[0_6px_28px_rgba(37,99,235,0.38)]
                   transition-all duration-200"
      >
        Buscar coches disponibles
        <ArrowRight className="w-4 h-4" />
      </button>

      <p className="text-center text-[11px] text-brand-muted">
        Solo <span className="text-brand-dark font-semibold">10€</span> para confirmar · El precio varía según el coche
      </p>
    </div>
  );
}

//  Step 2: Confirmation 

function StepConfirm({ onBack }: { onBack: () => void }) {
  const { totalDays, pickupLocation, pickupDate, returnDate } = useBookingStore();
  const router = useRouter();

  const fmt = (ts: number | null) =>
    ts ? format(new Date(ts), "d MMM yyyy", { locale: es }) : "";

  return (
    <div className="flex flex-col gap-5">
      {/* Summary rows */}
      <div className="rounded-xl bg-slate-50 border border-slate-100 divide-y divide-slate-100 overflow-hidden">
        {[
          { label: "Terminal", value: PICKUP_LOCATION_LABELS[pickupLocation] },
          { label: "Recogida", value: fmt(pickupDate) },
          { label: "Devolución", value: fmt(returnDate) },
          { label: "Duración", value: `${totalDays} ${totalDays === 1 ? "día" : "días"}` },
        ].map((r) => (
          <div key={r.label} className="flex justify-between items-center px-4 py-3 text-sm">
            <span className="text-brand-muted">{r.label}</span>
            <span className="font-semibold text-brand-dark">{r.value}</span>
          </div>
        ))}
      </div>

      {/* Info note  no price */}
      <div className="flex items-start gap-3 bg-brand-primary/5 border border-brand-primary/15 rounded-xl p-4">
        <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-white font-black text-xs">€</span>
        </div>
        <div>
          <p className="text-sm font-bold text-brand-dark">Pagas ahora: 10€</p>
          <p className="text-xs text-brand-muted mt-0.5">
            El precio exacto lo verás al elegir el vehículo. El depósito se descuenta del total.
          </p>
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

//  Animation variants 

const stepVariants = {
  enter: { opacity: 0, x: 16 },
  center: { opacity: 1, x: 0, transition: { duration: 0.2, ease: "easeOut" as const } },
  exit: { opacity: 0, x: -16, transition: { duration: 0.15, ease: "easeIn" as const } },
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
      {/* Header */}
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
