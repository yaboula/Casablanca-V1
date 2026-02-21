"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import CheckInProgressBar from "./CheckInProgressBar";
import DocumentUploadStep from "./DocumentUploadStep";
import { useTranslations } from "@/lib/i18n";

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
  const tCheckin = useTranslations("checkin");
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
            <h1 className="text-lg font-bold text-brand-dark">{tCheckin.title}</h1>
            <p className="text-xs text-brand-muted">
              {reservationId ? `${tCheckin.reservationLabel}${reservationId}` : tCheckin.verifyIdentity}
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
                  {tCheckin.step1of2}
                </p>
                <h2 className="text-xl font-bold text-brand-dark mt-1">{tCheckin.passport}</h2>
                <p className="text-sm text-brand-muted mt-1">
                  {tCheckin.passportDesc}
                </p>
              </div>
              <DocumentUploadStep type="PASSPORT" reservationId={reservationId} onComplete={handlePassportComplete} />
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
                  {tCheckin.step2of2}
                </p>
                <h2 className="text-xl font-bold text-brand-dark mt-1">{tCheckin.license}</h2>
                <p className="text-sm text-brand-muted mt-1">
                  {tCheckin.licenseDesc}
                </p>
              </div>
              <DocumentUploadStep type="DRIVING_LICENSE" reservationId={reservationId} onComplete={handleLicenseComplete} />
              <button
                type="button"
                onClick={() => {
                  setDirection(-1);
                  setStep(1);
                }}
                className="text-sm text-brand-muted hover:text-brand-dark transition-colors text-center"
              >
                {tCheckin.backToStep}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
