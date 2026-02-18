"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

const LOG_LINES = [
  "> Verificando integridad del pasaporte...",
  "> Validando licencia de conducir...",
  "> Cruzando datos de seguridad...",
] as const;

const LOG_DELAYS = [0, 1500, 3000] as const;

export default function WaitingRoomPage() {
  const router = useRouter();
  const [visibleLogs, setVisibleLogs] = useState<number>(1);
  const [isApproved, setIsApproved] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Reveal log lines one by one
    LOG_DELAYS.forEach((delay, index) => {
      timers.push(
        setTimeout(() => setVisibleLogs(index + 1), delay)
      );
    });

    // Simulate operator approval after 5 seconds
    timers.push(
      setTimeout(() => setIsApproved(true), 5000)
    );

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <motion.div
        layout
        className="bg-brand-surface rounded-brand-container shadow-card p-8 max-w-sm w-full text-center flex flex-col items-center relative overflow-hidden"
        transition={{ layout: { duration: 0.4, ease: "easeInOut" as const } }}
      >
        {/* Icon area */}
        <div className="w-24 h-24 bg-brand-bg rounded-full flex items-center justify-center mb-6 relative">
          <AnimatePresence mode="wait">
            {isApproved ? (
              <motion.div
                key="approved"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring" as const, stiffness: 300, damping: 20 }}
              >
                <CheckCircle2 className="w-16 h-16 text-brand-success" />
              </motion.div>
            ) : (
              <motion.div
                key="scanning"
                className="relative flex items-center justify-center w-full h-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {/* Radar rings */}
                {[0, 1].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full border-2 border-brand-primary"
                    style={{ width: "100%", height: "100%" }}
                    animate={{ scale: [1, 1.5, 2], opacity: [0.5, 0.2, 0] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 1,
                      ease: "easeOut" as const,
                    }}
                  />
                ))}
                <ShieldCheck className="w-10 h-10 text-brand-primary z-10 relative" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Title */}
        <AnimatePresence mode="wait">
          <motion.h1
            key={isApproved ? "approved-title" : "analyzing-title"}
            className="text-xl font-bold text-brand-dark mb-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {isApproved ? "¡Perfil Verificado!" : "Analizando Perfil"}
          </motion.h1>
        </AnimatePresence>

        {/* Subtitle */}
        <p className="text-sm text-brand-muted mb-8">
          Karim y nuestro sistema de seguridad están verificando tus documentos.
          Esto tomará menos de 2 minutos.
        </p>

        {/* Log terminal */}
        <div className="bg-slate-50 text-xs text-slate-500 rounded-lg p-3 w-full text-left font-mono space-y-2 mb-6">
          {LOG_LINES.slice(0, visibleLogs).map((line, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {line}
            </motion.p>
          ))}
        </div>

        {/* Approval CTA */}
        <AnimatePresence>
          {isApproved && (
            <motion.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" as const }}
              onClick={() => router.push("/smart-ticket")}
              className="w-full min-h-[48px] bg-brand-success hover:bg-emerald-600 text-white font-bold rounded-brand-pill shadow-sm transition-colors"
            >
              Ver mi Smart Ticket
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
