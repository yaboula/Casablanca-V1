"use client";

import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowRight, MapPin } from "lucide-react";
import DualTimelineSlider, { DateRange } from "@/components/shared/DualTimelineSlider";
import Price from "@/components/shared/Price";
import { useBookingStore } from "@/stores/useBookingStore";
import { PICKUP_LOCATION_LABELS, DEPOSIT_AMOUNT_EUR } from "@/lib/constants";
import type { PickupLocation } from "@/types";

//  Step definitions 

type Step = 1 | 2;

const STEP_LABELS: Record<Step, string> = {
  1: "¿Cuándo llegas?",
  2: "Confirmar reserva",
};

//  Animation variants 

const stepVariants = {
  enter: { opacity: 0, x: 20 },
  center: { opacity: 1, x: 0, transition: { duration: 0.22, ease: "easeOut" as const } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.18, ease: "easeIn" as const } },
};

//  Locations 

const LOCATIONS: PickupLocation[] = ["CMN_T1", "CMN_T2"];

//  Step 1: Dates + Location 

function StepDates({ onNext }: { onNext: () => void }) {
  const { pickupLocation, totalDays, totalPriceEUR, setDates, setLocation } =
    useBookingStore();

  const handleDatesChange = useCallback(
    (range: DateRange) => setDates(range.pickup.getTime(), range.return.getTime()),
    [setDates]
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Location toggle */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-brand-muted uppercase tracking-wider">
          Terminal de recogida
        </label>
        <div className="flex gap-2">
          {LOCATIONS.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => setLocation(loc)}
              className={`flex-1 min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                pickupLocation === loc
                  ? "bg-brand-primary text-white border-brand-primary shadow-sm"
                  : "bg-white text-brand-muted border-slate-200 hover:border-brand-primary"
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              {PICKUP_LOCATION_LABELS[loc]}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline slider */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-brand-muted uppercase tracking-wider">
          Fechas de alquiler
        </label>
        <DualTimelineSlider onDatesChange={handleDatesChange} />
      </div>

      {/* Summary + CTA */}
      <div className="flex flex-col gap-3 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-brand-muted">
              {totalDays ? `${totalDays} días` : "Selecciona fechas"}
            </p>
            {totalPriceEUR ? (
              <Price amount={totalPriceEUR} size="lg" animated className="text-brand-dark" />
            ) : (
              <span className="text-base font-bold text-brand-muted"> €</span>
            )}
          </div>
          <div className="text-right">
            <p className="text-[10px] text-brand-muted">Solo pagas ahora</p>
            <Price amount={DEPOSIT_AMOUNT_EUR} size="md" className="text-brand-primary" />
          </div>
        </div>

        <button
          type="button"
          onClick={onNext}
          disabled={!totalDays}
          className="w-full min-h-[52px] bg-brand-primary disabled:bg-slate-200 disabled:text-slate-400
                     text-white font-bold rounded-full flex items-center justify-center gap-2
                     transition-all hover:bg-brand-primary-hover
                     shadow-[0_4px_20px_rgba(37,99,235,0.25)] hover:shadow-[0_6px_28px_rgba(37,99,235,0.35)]"
        >
          Ver coches disponibles
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

//  Step 2: Confirmation 

function StepConfirm({ onBack }: { onBack: () => void }) {
  const { totalDays, totalPriceEUR, pickupLocation } = useBookingStore();
  const router = useRouter();

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 flex flex-col gap-3">
        <div className="flex justify-between text-sm">
          <span className="text-brand-muted">Terminal</span>
          <span className="font-semibold text-brand-dark">
            {PICKUP_LOCATION_LABELS[pickupLocation]}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-brand-muted">Duración</span>
          <span className="font-semibold text-brand-dark">
            {totalDays} {totalDays === 1 ? "día" : "días"}
          </span>
        </div>
        <div className="border-t border-slate-200 pt-3 flex justify-between">
          <span className="font-semibold text-brand-dark">Total estimado</span>
          {totalPriceEUR && (
            <Price amount={totalPriceEUR} size="md" animated className="text-brand-dark" />
          )}
        </div>
        <div className="flex justify-between text-xs text-brand-muted">
          <span>Pagas ahora (depósito)</span>
          <Price amount={DEPOSIT_AMOUNT_EUR} size="sm" className="text-brand-primary" />
        </div>
      </div>

      <button
        type="button"
        onClick={() => router.push("/catalog")}
        className="w-full min-h-[52px] bg-brand-primary text-white font-bold rounded-full
                   flex items-center justify-center gap-2 transition-all hover:bg-brand-primary-hover"
      >
        Elegir mi coche <ArrowRight className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={onBack}
        className="text-xs text-brand-muted text-center hover:text-brand-dark transition-colors"
      >
         Cambiar fechas
      </button>
    </div>
  );
}

//  Step indicator 

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          className="h-1 rounded-full"
          animate={{
            width: i === current - 1 ? 24 : 8,
            backgroundColor: i < current ? "#2563EB" : "#E2E8F0",
          }}
          transition={{ duration: 0.3 }}
        />
      ))}
    </div>
  );
}

//  Main export 

export default function BookingPanel() {
  const [step, setStep] = useState<Step>(1);

  const goNext = useCallback(() => setStep(2), []);
  const goBack = useCallback(() => setStep(1), []);

  return (
    <motion.div
      className="bg-white border border-slate-200 shadow-xl rounded-2xl p-5 md:p-6 lg:sticky lg:top-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Panel header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-brand-muted font-medium">
            Paso {step} de 2
          </p>
          <h3 className="text-base font-bold text-brand-dark">{STEP_LABELS[step]}</h3>
        </div>
        <StepIndicator current={step} total={2} />
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <StepDates onNext={goNext} />
          </motion.div>
        )}
        {step === 2 && (
          <motion.div
            key="step2"
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <StepConfirm onBack={goBack} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
