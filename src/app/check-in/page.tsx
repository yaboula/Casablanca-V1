"use client";

import { useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  Camera,
  CheckCircle2,
  FileText,
  ImageIcon,
} from "lucide-react";
import Link from "next/link";

const slideVariants: Variants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.25, ease: "easeOut" as const },
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -60 : 60,
    opacity: 0,
    transition: { duration: 0.2, ease: "easeIn" as const },
  }),
};

export default function CheckInPage() {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [isComplete, setIsComplete] = useState(false);

  function goToStep(next: number) {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  }

  function handlePassportAction() {
    goToStep(2);
  }

  function handleLicenseAction() {
    console.log("Documentos subidos — iniciando verificación.");
    setIsComplete(true);
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10">
      <div className="w-full max-w-md bg-brand-surface rounded-brand-container shadow-card p-6 md:p-8 flex flex-col gap-6 relative overflow-hidden">

        {/* Progress bar */}
        {!isComplete && (
          <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-brand-primary rounded-full"
              initial={false}
              animate={{ width: step === 1 ? "50%" : "100%" }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            />
          </div>
        )}

        {/* Step content */}
        <AnimatePresence mode="wait" custom={direction}>
          {isComplete ? (
            /* ── Success state ── */
            <motion.div
              key="complete"
              custom={1}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="flex flex-col items-center gap-4 text-center py-4"
            >
              <div className="bg-emerald-50 rounded-full p-4">
                <CheckCircle2 className="w-14 h-14 text-brand-success" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-brand-dark">
                  Documentos enviados
                </h2>
                <p className="text-brand-muted mt-2">
                  Estamos verificando tu perfil. Te notificaremos cuando
                  esté listo, normalmente en menos de 1 hora.
                </p>
              </div>
              <Link
                href="/"
                className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white py-3.5 rounded-brand-pill font-semibold flex items-center justify-center gap-2 transition-colors mt-2"
              >
                Volver al inicio
              </Link>
            </motion.div>

          ) : step === 1 ? (
            /* ── Step 1: Pasaporte ── */
            <motion.div
              key="step-1"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="flex flex-col gap-5"
            >
              {/* Header */}
              <div>
                <p className="text-sm font-semibold text-brand-primary tracking-wider uppercase">
                  Paso 1 de 2
                </p>
                <h2 className="text-2xl font-bold text-brand-dark mt-1">
                  Verifica tu Pasaporte
                </h2>
                <p className="text-brand-muted mt-1.5 text-sm leading-relaxed">
                  Necesitamos una foto clara de tu pasaporte para preparar
                  tu vehículo. Sin reflejos.
                </p>
              </div>

              {/* Upload area */}
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center gap-4 text-slate-400">
                <FileText className="w-14 h-14" strokeWidth={1.25} />
                <p className="text-sm font-medium text-center">
                  Página de datos del pasaporte
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handlePassportAction}
                  className="w-full bg-brand-primary text-white py-3.5 rounded-brand-pill font-semibold flex items-center justify-center gap-2 hover:bg-brand-primary-hover transition-colors min-h-[48px]"
                >
                  <Camera className="w-5 h-5" />
                  Tomar foto ahora
                </button>
                <button
                  type="button"
                  onClick={handlePassportAction}
                  className="w-full bg-slate-100 text-brand-dark py-3.5 rounded-brand-pill font-semibold flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors min-h-[48px]"
                >
                  <ImageIcon className="w-5 h-5" />
                  Elegir de la galería
                </button>
              </div>
            </motion.div>

          ) : (
            /* ── Step 2: Carnet de Conducir ── */
            <motion.div
              key="step-2"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="flex flex-col gap-5"
            >
              {/* Header */}
              <div>
                <p className="text-sm font-semibold text-brand-primary tracking-wider uppercase">
                  Paso 2 de 2
                </p>
                <h2 className="text-2xl font-bold text-brand-dark mt-1">
                  Carnet de Conducir
                </h2>
                <p className="text-brand-muted mt-1.5 text-sm leading-relaxed">
                  Sube la parte frontal de tu licencia en vigor.
                </p>
              </div>

              {/* Upload area */}
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center gap-4 text-slate-400">
                <FileText className="w-14 h-14" strokeWidth={1.25} />
                <p className="text-sm font-medium text-center">
                  Parte frontal del carnet
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleLicenseAction}
                  className="w-full bg-brand-primary text-white py-3.5 rounded-brand-pill font-semibold flex items-center justify-center gap-2 hover:bg-brand-primary-hover transition-colors min-h-[48px]"
                >
                  <Camera className="w-5 h-5" />
                  Tomar foto ahora
                </button>
                <button
                  type="button"
                  onClick={handleLicenseAction}
                  className="w-full bg-slate-100 text-brand-dark py-3.5 rounded-brand-pill font-semibold flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors min-h-[48px]"
                >
                  <ImageIcon className="w-5 h-5" />
                  Elegir de la galería
                </button>
                {/* Back link */}
                <button
                  type="button"
                  onClick={() => goToStep(1)}
                  className="text-sm text-brand-muted hover:text-brand-dark transition-colors text-center mt-1"
                >
                  ← Volver al paso anterior
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
