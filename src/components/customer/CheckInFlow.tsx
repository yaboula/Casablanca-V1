"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import CheckInProgressBar from "./CheckInProgressBar";
import DocumentUploadStep from "./DocumentUploadStep";

// ── Slide variants ────────────────────────────────────────────

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

// ── Component ─────────────────────────────────────────────────

interface Props {
  reservationId: string | null;
}

export default function CheckInFlow({ reservationId }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [direction, setDirection] = useState(1);

  const handlePassportComplete = useCallback(() => {
    setDirection(1);
    setStep(2);
  }, []);

  const handleLicenseComplete = useCallback(() => {
    const qs = reservationId ? `?reservationId=${reservationId}` : "";
    router.push(`/waiting-room${qs}`);
  }, [router, reservationId]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-5 md:p-7 flex flex-col gap-6 relative overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-brand-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-brand-dark">Check-in de seguridad</h1>
            <p className="text-xs text-brand-muted">
              {reservationId ? `Reserva #${reservationId}` : "Verifica tu identidad"}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <CheckInProgressBar currentStep={step} />

        {/* Step content */}
        <AnimatePresence mode="wait" custom={direction}>
          {step === 1 ? (
            <motion.div
              key="step-passport"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-4"
            >
              <div>
                <p className="text-sm font-semibold text-brand-primary tracking-wider uppercase">
                  Paso 1 de 2
                </p>
                <h2 className="text-xl font-bold text-brand-dark mt-1">Pasaporte</h2>
                <p className="text-sm text-brand-muted mt-1">
                  Fotografía la página con tu foto. Sin reflejos, buena iluminación.
                </p>
              </div>
              <DocumentUploadStep type="PASSPORT" onComplete={handlePassportComplete} />
            </motion.div>
          ) : (
            <motion.div
              key="step-license"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-4"
            >
              <div>
                <p className="text-sm font-semibold text-brand-primary tracking-wider uppercase">
                  Paso 2 de 2
                </p>
                <h2 className="text-xl font-bold text-brand-dark mt-1">Carnet de Conducir</h2>
                <p className="text-sm text-brand-muted mt-1">
                  Parte frontal de tu licencia de conducir en vigor.
                </p>
              </div>
              <DocumentUploadStep type="DRIVING_LICENSE" onComplete={handleLicenseComplete} />
              <button
                type="button"
                onClick={() => {
                  setDirection(-1);
                  setStep(1);
                }}
                className="text-sm text-brand-muted hover:text-brand-dark transition-colors text-center"
              >
                ← Volver al paso anterior
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
