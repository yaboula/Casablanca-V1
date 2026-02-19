"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Plane, QrCode, Key } from "lucide-react";

// ── Animation variants ────────────────────────────────────────

const introLetterContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.065, delayChildren: 0.15 } },
};
const introLetterItem = {
  hidden: { y: "110%" },
  visible: {
    y: "0%",
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const INTRO_STEPS = [
  {
    Icon: Plane,
    n: "01",
    label: "Aterriza",
    sub: "CMN · Terminal 1 & 2",
    delay: 0.52,
    accent: false,
  },
  {
    Icon: QrCode,
    n: "02",
    label: "Escanea",
    sub: "QR en zona de llegadas",
    delay: 0.72,
    accent: false,
  },
  {
    Icon: Key,
    n: "03",
    label: "Conduce",
    sub: "Tu coche en 30 segundos",
    delay: 0.92,
    accent: true,
  },
] as const;

// ── Component ─────────────────────────────────────────────────

interface IntroSplashProps {
  onDone: () => void;
}

export default function IntroSplash({ onDone }: IntroSplashProps) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-[200] overflow-hidden flex flex-col items-center justify-center gap-10"
      style={{ background: "#0A1628" }}
      exit={{
        y: "-100%",
        transition: { duration: 0.85, ease: [0.76, 0, 0.24, 1] as const },
      }}
    >
      {/* Blue top glow */}
      <div
        aria-hidden
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[420px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(37,99,235,0.22) 0%, transparent 72%)",
        }}
      />
      {/* Top edge glow */}
      <div
        aria-hidden
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background:
            "linear-gradient(to right, transparent, rgba(59,130,246,0.8) 30%, rgba(147,197,253,0.9) 50%, rgba(59,130,246,0.8) 70%, transparent)",
        }}
      />

      {/* NEXUS. wordmark */}
      <div className="relative z-10 flex flex-col items-center gap-2 select-none">
        <motion.div
          variants={introLetterContainer}
          initial="hidden"
          animate="visible"
          className="flex items-baseline"
        >
          {"NEXUS".split("").map((char, i) => (
            <span key={i} className="overflow-hidden inline-block">
              <motion.span
                variants={introLetterItem}
                className="inline-block font-black leading-none text-white"
                style={{ fontSize: "clamp(2.6rem,8vw,4.5rem)", letterSpacing: "0.14em" }}
              >
                {char}
              </motion.span>
            </span>
          ))}
          <span className="overflow-hidden inline-block">
            <motion.span
              variants={introLetterItem}
              className="inline-block font-black leading-none"
              style={{
                fontSize: "clamp(2.6rem,8vw,4.5rem)",
                letterSpacing: "0.14em",
                color: "#3B82F6",
              }}
            >
              .
            </motion.span>
          </span>
        </motion.div>

        <div className="overflow-hidden">
          <motion.p
            className="text-[0.58rem] font-semibold tracking-[0.3em] uppercase"
            style={{ color: "#334D6B" }}
            initial={{ y: "100%" }}
            animate={{ y: "0%" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] as const, delay: 0.38 }}
          >
            Alquiler de coches en el aeropuerto
          </motion.p>
        </div>
      </div>

      {/* 3-step service flow */}
      <div className="relative z-10 flex flex-col items-start gap-0">
        {INTRO_STEPS.map(({ Icon, n, label, sub, delay, accent }, idx) => (
          <div key={n} className="flex flex-col items-start">
            <motion.div
              className="flex items-center gap-4"
              initial={{ opacity: 0, x: -22 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const, delay }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: accent ? "rgba(16,185,129,0.12)" : "rgba(59,130,246,0.1)",
                  border: accent
                    ? "1px solid rgba(16,185,129,0.25)"
                    : "1px solid rgba(59,130,246,0.2)",
                }}
              >
                <Icon
                  size={18}
                  strokeWidth={1.8}
                  style={{ color: accent ? "#34D399" : "#60A5FA" }}
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-baseline gap-2">
                  <span
                    className="font-mono text-[0.55rem] tracking-widest"
                    style={{ color: accent ? "#34D399" : "#3B82F6" }}
                  >
                    {n}
                  </span>
                  <span
                    className="font-bold text-white"
                    style={{ fontSize: "1rem", letterSpacing: "-0.01em" }}
                  >
                    {label}
                  </span>
                </div>
                <span className="text-[0.68rem]" style={{ color: "#3D5A80" }}>
                  {sub}
                </span>
              </div>
            </motion.div>

            {idx < INTRO_STEPS.length - 1 && (
              <div className="ml-[21px] h-7 w-px overflow-hidden">
                <motion.div
                  className="w-full h-full origin-top"
                  style={{
                    background:
                      "linear-gradient(to bottom, rgba(59,130,246,0.35), rgba(59,130,246,0.08))",
                  }}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{
                    duration: 0.4,
                    ease: [0.22, 1, 0.36, 1] as const,
                    delay: delay + 0.28,
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <motion.div
        className="relative z-10 w-52 h-px rounded-full overflow-hidden"
        style={{ background: "rgba(255,255,255,0.06)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.25 }}
      >
        <motion.div
          className="absolute inset-y-0 left-0"
          style={{
            background: "linear-gradient(90deg, #1D4ED8, #3B82F6 60%, #34D399)",
          }}
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 2.7, ease: [0.22, 1, 0.36, 1] as const, delay: 0.32 }}
        />
      </motion.div>
    </motion.div>
  );
}
