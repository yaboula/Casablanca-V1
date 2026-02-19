"use client";

import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { ArrowRight, Car, Clock, Plane, ShieldCheck, Star, User, Zap } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import TrustCard from "@/components/vehicles/TrustCard";
import CountUp from "@/components/ui/CountUp";
import MagneticButton from "@/components/ui/MagneticButton";
import Marquee from "@/components/ui/Marquee";
import SpotlightCard from "@/components/ui/SpotlightCard";

/* -- Data ------------------------------------------------------------------ */

const VEHICLES = [
  {
    model: "Audi A4",
    totalPrice: "800EUR",
    imageUrl:
      "https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?q=80&w=800&auto=format&fit=crop",
  },
  {
    model: "Mercedes Clase C",
    totalPrice: "950EUR",
    imageUrl:
      "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=800&auto=format&fit=crop",
  },
  {
    model: "Range Rover Evoque",
    totalPrice: "1.200EUR",
    imageUrl:
      "https://images.unsplash.com/photo-1519245659620-e859806a8d3b?q=80&w=800&auto=format&fit=crop",
  },
];

const MARQUEE_ITEMS = [
  "Mohammed V Airport",
  "CMN 24/7",
  "Flota Premium",
  "Cero Burocracia",
  "Reserva por 10EUR",
  "Entrega Inmediata",
  "Check-in Digital",
  "Sin Colas",
];

const STATS: Array<{ to: number; suffix: string; prefix?: string; label: string }> = [
  { to: 500, suffix: "+", label: "Clientes satisfechos" },
  { to: 24, suffix: "h", label: "Soporte continuo" },
  { to: 10, prefix: "\u20ac", suffix: "", label: "Para asegurar tu coche" },
];

const STEPS = [
  { n: "1", label: "Aterriza" },
  { n: "2", label: "Escanea QR" },
  { n: "3", label: "Conduce", accent: true },
];

/* -- Char reveal (smooth clip stagger) ------------------------------------- */

const charContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.032, delayChildren: 0.55 } },
};
const charItem = {
  hidden: { y: "108%", rotateX: 12 },
  visible: {
    y: "0%",
    rotateX: 0,
    transition: { duration: 0.52, ease: [0.22, 1, 0.36, 1] as const },
  },
};

/* -- Word clip stagger ----------------------------------------------------- */
const wordContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.13, delayChildren: 0.18 } },
};
const wordItem = {
  hidden: { y: "115%" },
  visible: {
    y: "0%",
    transition: { duration: 0.68, ease: [0.22, 1, 0.36, 1] as const },
  },
};

/* -- Section fade-up ------------------------------------------------------- */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

/* ==========================================================================
   INTRO SPLASH — Airport cinematic entrance
   ========================================================================== */
function IntroSplash({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3600);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#080D1A] overflow-hidden"
      initial={{ y: 0 }}
      exit={{
        y: "-100%",
        transition: { duration: 0.9, ease: [0.76, 0, 0.24, 1] as const },
      }}
    >
      {/* ── Dot grid ──────────────────────────────────── */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.18]"
        style={{
          backgroundImage: "radial-gradient(circle, #334155 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      {/* ── Blue radial top-right ─────────────────────── */}
      <div
        aria-hidden
        className="absolute top-0 right-0 w-[700px] h-[700px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at top right, rgba(37,99,235,0.20) 0%, transparent 62%)",
        }}
      />
      {/* ── Emerald radial bottom-left ────────────────── */}
      <div
        aria-hidden
        className="absolute bottom-0 left-0 w-[400px] h-[400px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at bottom left, rgba(16,185,129,0.08) 0%, transparent 60%)",
        }}
      />

      {/* ── Airport scene ─────────────────────────────── */}
      <div className="relative z-10 w-72 sm:w-96 h-44 mb-10">

        {/* Runway label */}
        <motion.p
          className="absolute top-0 left-0 text-[9px] text-slate-600 tracking-[0.22em] uppercase font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.5 }}
        >
          CMN · Runway 25L
        </motion.p>

        {/* ── Sky horizon glow ── */}
        <div
          aria-hidden
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            bottom: "56px",
            height: "40px",
            background: "linear-gradient(to top, rgba(37,99,235,0.06), transparent)",
          }}
        />

        {/* ── Runway ground line ── */}
        <motion.div
          className="absolute left-0 right-0 h-px bg-slate-600"
          style={{ bottom: "52px", transformOrigin: "left center" }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" as const }}
        />

        {/* ── Runway center dashes ── */}
        <motion.div
          className="absolute left-0 right-0 flex gap-2"
          style={{ bottom: "50px" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.3 }}
        >
          {[...Array(9)].map((_, i) => (
            <div key={i} className="flex-1 h-px bg-slate-700" />
          ))}
        </motion.div>

        {/* ── Plane — descends from top-right ── */}
        {/* Lucide Plane points NE by default. scaleX(-1) flips it to NW.       */}
        {/* rotate: -35 tilts nose down → landing approach. rotate: 0 = level.  */}
        <motion.div
          className="absolute"
          style={{ transformOrigin: "center center" }}
          initial={{ x: 200, y: -35, rotate: -35, opacity: 0 }}
          animate={{
            x:      [210, 130,  55,  18],
            y:      [-35,   0,  46,  46],
            rotate: [-35, -24,  -7,   0],
            opacity:[  0,   1,   1,   1],
          }}
          transition={{
            duration: 1.7,
            delay: 0.45,
            times: [0, 0.32, 0.72, 1],
            ease: [0.3, 1, 0.4, 1] as const,
          }}
        >
          <Plane
            className="w-8 h-8 text-white drop-shadow-[0_0_8px_rgba(37,99,235,0.6)]"
            style={{ transform: "scaleX(-1)" }}
          />
        </motion.div>

        {/* ── Touch-down glow burst ── */}
        <motion.div
          className="absolute rounded-full bg-brand-primary blur-md"
          style={{ bottom: "46px", left: "28px", width: "36px", height: "10px" }}
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: [0, 0.9, 0], scaleX: [0, 1.4, 0] }}
          transition={{ delay: 2.15, duration: 0.45, ease: "easeOut" as const }}
        />

        {/* ── Person — walks right after plane stops ── */}
        <motion.div
          className="absolute"
          style={{ bottom: "50px" }}
          initial={{ x: 22, opacity: 0 }}
          animate={{
            x:       [22,  26,  62, 100],
            opacity: [ 0,   1,   1,   0],
          }}
          transition={{
            delay: 2.35,
            duration: 0.85,
            times: [0, 0.07, 0.78, 1],
            ease: "easeOut" as const,
          }}
        >
          <User className="w-4 h-4 text-slate-400" />
        </motion.div>

        {/* ── Road line (below runway) ── */}
        <motion.div
          className="absolute left-0 right-0 h-px bg-slate-700"
          style={{ bottom: "20px", transformOrigin: "left center" }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.5, duration: 0.55, ease: "easeOut" as const }}
        />

        {/* ── Car — zooms L→R on the road ── */}
        <motion.div
          className="absolute flex items-center"
          style={{ bottom: "14px" }}
          initial={{ x: -90, opacity: 0 }}
          animate={{
            x:       [-90, -50, 480],
            opacity: [  0,   1,   1],
          }}
          transition={{
            delay: 2.55,
            duration: 0.7,
            times: [0, 0.06, 1],
            ease: [0.4, 0, 0.2, 1] as const,
          }}
        >
          <Car
            className="w-7 h-7 text-brand-primary drop-shadow-[0_0_10px_rgba(37,99,235,0.7)]"
          />
          {/* Speed lines */}
          <div className="flex flex-col gap-[3px] ml-0.5 -translate-x-2">
            <div className="w-5 h-px bg-brand-primary/25 rounded" />
            <div className="w-3 h-px bg-brand-primary/18 rounded" />
            <div className="w-6 h-px bg-brand-primary/25 rounded" />
          </div>
        </motion.div>
      </div>

      {/* ── Logo + bar ────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="overflow-hidden">
          <motion.p
            className="text-4xl sm:text-6xl font-black text-white tracking-tight"
            initial={{ y: "110%" }}
            animate={{ y: "0%" }}
            transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] as const, delay: 2.8 }}
          >
            Casablanca<span className="text-brand-primary">.</span>
          </motion.p>
        </div>

        <div className="overflow-hidden">
          <motion.p
            className="text-[10px] text-slate-500 tracking-[0.3em] uppercase font-medium"
            initial={{ y: "110%" }}
            animate={{ y: "0%" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const, delay: 3.0 }}
          >
            Alquiler de Coches · CMN
          </motion.p>
        </div>

        {/* Loading bar */}
        <motion.div
          className="mt-2 w-28 h-[2px] bg-slate-800 rounded-full overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.05 }}
        >
          <motion.div
            className="h-full bg-brand-primary rounded-full"
            initial={{ x: "-100%" }}
            animate={{ x: "0%" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] as const, delay: 3.1 }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ========================================================================== */

export default function Home() {
  const [introVisible, setIntroVisible] = useState(true);

  /* -- Mouse spotlight (Framer springs — GPU only) -- */
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { damping: 28, stiffness: 100, mass: 0.5 });
  const springY = useSpring(mouseY, { damping: 28, stiffness: 100, mass: 0.5 });
  const spotlightBg = useMotionTemplate`radial-gradient(700px at ${springX}px ${springY}px, rgba(37, 99, 235, 0.07), transparent 80%)`;

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    },
    [mouseX, mouseY]
  );

  const scrollToFleet = () =>
    document.getElementById("fleet")?.scrollIntoView({ behavior: "smooth" });

  return (
    <>
      {/* ── Intro splash ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {introVisible && (
          <IntroSplash key="intro" onDone={() => setIntroVisible(false)} />
        )}
      </AnimatePresence>

      <div className="relative w-full bg-brand-bg">

        {/* ================================================================
            1. HERO — Premium airport-first experience
        ================================================================ */}
        <section
          className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 py-20"
          onMouseMove={handleMouseMove}
        >
          {/* ── Mouse-reactive spotlight ──────────────────────────────── */}
          <motion.div
            aria-hidden
            className="absolute inset-0 pointer-events-none z-[2]"
            style={{ background: spotlightBg }}
          />

          {/* ── Dot grid ──────────────────────────────────────────────── */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none z-[1]"
            style={{
              backgroundImage:
                "radial-gradient(circle, #CBD5E1 1px, transparent 1px)",
              backgroundSize: "28px 28px",
              opacity: 0.55,
            }}
          />

          {/* ── Color radials ─────────────────────────────────────────── */}
          <div
            aria-hidden
            className="absolute top-0 right-0 w-[700px] h-[700px] pointer-events-none z-[1]"
            style={{
              background:
                "radial-gradient(ellipse at top right, rgba(37,99,235,0.10) 0%, transparent 62%)",
            }}
          />
          <div
            aria-hidden
            className="absolute bottom-0 left-0 w-[500px] h-[500px] pointer-events-none z-[1]"
            style={{
              background:
                "radial-gradient(ellipse at bottom left, rgba(16,185,129,0.07) 0%, transparent 60%)",
            }}
          />

          {/* ── Floating badges (desktop) ──────────────────────────────── */}

          <motion.div
            className="absolute top-[22%] left-[6%] xl:left-[12%] hidden lg:block z-10"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}
          >
            <motion.div
              animate={{ y: [0, -9, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" as const, delay: 0.3 }}
              className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.06)] cursor-default select-none"
            >
              <span className="w-8 h-8 rounded-xl bg-brand-primary flex items-center justify-center text-white text-sm font-black flex-shrink-0">
                €
              </span>
              <div>
                <p className="text-brand-dark font-bold text-sm leading-none">Solo 10EUR</p>
                <p className="text-brand-muted text-[10px] mt-0.5">Para reservar</p>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            className="absolute top-[18%] right-[6%] xl:right-[12%] hidden lg:block z-10"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2.4, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}
          >
            <motion.div
              animate={{ y: [0, -7, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" as const, delay: 1 }}
              className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.06)] cursor-default select-none"
            >
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <div>
                <p className="text-brand-dark font-bold text-sm leading-none">4.9 / 5</p>
                <p className="text-brand-muted text-[10px] mt-0.5">500 reseñas</p>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            className="absolute bottom-[28%] left-[5%] xl:left-[10%] hidden lg:block z-10"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2.6, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" as const, delay: 0.8 }}
              className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.06)] cursor-default select-none"
            >
              <span className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-white" />
              </span>
              <div>
                <p className="text-brand-dark font-bold text-sm leading-none">30 segundos</p>
                <p className="text-brand-muted text-[10px] mt-0.5">Tiempo de recogida</p>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            className="absolute bottom-[30%] right-[5%] xl:right-[10%] hidden lg:block z-10"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2.8, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" as const, delay: 1.5 }}
              className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.06)] cursor-default select-none"
            >
              <span className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-brand-dark" />
              </span>
              <div>
                <p className="text-brand-dark font-bold text-sm leading-none">24/7 CMN</p>
                <p className="text-brand-muted text-[10px] mt-0.5">Soporte en aeropuerto</p>
              </div>
            </motion.div>
          </motion.div>

          {/* ── Center content ─────────────────────────────────────────── */}
          <div className="relative z-10 flex flex-col items-center text-center w-full max-w-3xl">

            {/* Live availability pill */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.9, duration: 0.55, ease: [0.22, 1, 0.36, 1] as const }}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-slate-200 bg-white shadow-sm text-xs text-brand-muted tracking-[0.16em] uppercase font-semibold mb-10"
            >
              <span className="relative flex h-2 w-2 flex-shrink-0">
                <span className="absolute inline-flex h-full w-full rounded-full bg-brand-success opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-success" />
              </span>
              Disponible · CMN · Aeropuerto Mohammed V
            </motion.div>

            {/* ── Headline line 1 — word clip stagger ─────────────────── */}
            <div className="mb-3 w-full">
              <motion.div
                variants={wordContainer}
                initial="hidden"
                animate="visible"
                className="flex flex-wrap justify-center gap-x-[0.28em]"
                style={{ fontSize: "clamp(3.5rem, 11vw, 6.5rem)" }}
              >
                {["Tu", "coche."].map((word) => (
                  <span key={word} className="overflow-hidden inline-block pb-1">
                    <motion.span
                      variants={wordItem}
                      className="inline-block font-black tracking-tight leading-[1.05] text-brand-dark"
                    >
                      {word}
                    </motion.span>
                  </span>
                ))}
              </motion.div>

              {/* ── Headline line 2 — char clip stagger (smooth) ─────── */}
              <motion.div
                variants={charContainer}
                initial="hidden"
                animate="visible"
                className="flex flex-wrap justify-center"
                style={{
                  fontSize: "clamp(3.5rem, 11vw, 6.5rem)",
                  perspective: "800px",
                }}
                aria-label="Al instante."
              >
                {"Al instante.".split("").map((char, i) => (
                  <span
                    key={i}
                    className="overflow-hidden inline-block"
                    style={{ paddingBottom: "0.05em" }}
                  >
                    <motion.span
                      variants={charItem}
                      className="inline-block font-black tracking-tight leading-[1.05] text-brand-primary"
                      style={{ display: char === " " ? "inline" : "inline-block" }}
                    >
                      {char === " " ? "\u00A0" : char}
                    </motion.span>
                  </span>
                ))}
              </motion.div>
            </div>

            {/* ── 3-step process strip ─────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6, duration: 0.55, ease: [0.22, 1, 0.36, 1] as const }}
              className="flex items-center gap-2 sm:gap-3 mb-8"
            >
              {STEPS.map((step, i) => (
                <span key={step.n} className="flex items-center gap-2 sm:gap-3">
                  <span className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-full text-[11px] font-black flex items-center justify-center flex-shrink-0 ${
                        step.accent
                          ? "bg-brand-success text-white"
                          : "bg-brand-primary/10 text-brand-primary"
                      }`}
                    >
                      {step.n}
                    </span>
                    <span
                      className={`text-xs sm:text-sm font-semibold ${
                        step.accent ? "text-brand-success" : "text-brand-dark"
                      }`}
                    >
                      {step.label}
                    </span>
                  </span>
                  {i < STEPS.length - 1 && (
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                  )}
                </span>
              ))}
            </motion.div>

            {/* ── Subtitle ─────────────────────────────────────────────── */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.65, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
              className="text-base md:text-lg text-brand-muted max-w-sm mb-10 leading-relaxed"
            >
              Sin filas. Sin papel. Solo tú y la carretera.
            </motion.p>

            {/* ── CTA group ────────────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.75, duration: 0.55, ease: [0.22, 1, 0.36, 1] as const }}
              className="flex flex-col sm:flex-row items-center gap-4 mb-10"
            >
              <MagneticButton
                onClick={scrollToFleet}
                className="group relative overflow-hidden flex items-center gap-3 bg-brand-primary text-white font-bold text-sm px-8 py-4 rounded-brand-pill min-h-[52px] shadow-[0_4px_24px_rgba(37,99,235,0.30)] hover:shadow-[0_8px_40px_rgba(37,99,235,0.42)] hover:bg-brand-primary-hover transition-all"
              >
                {/* Shimmer overlay */}
                <motion.span
                  aria-hidden
                  className="absolute inset-0 -skew-x-12 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.22) 50%, transparent 100%)",
                  }}
                  animate={{ x: ["-120%", "220%"] }}
                  transition={{
                    duration: 1.6,
                    repeat: Infinity,
                    repeatDelay: 2.8,
                    ease: "easeInOut" as const,
                  }}
                />
                <span className="relative">Reservar ahora</span>
                <span className="relative font-black opacity-75">· 10EUR</span>
                <ArrowRight className="relative w-4 h-4 transition-transform group-hover:translate-x-1" />
              </MagneticButton>

              <button
                type="button"
                onClick={scrollToFleet}
                className="text-brand-muted hover:text-brand-dark text-xs tracking-[0.18em] uppercase font-semibold transition-colors min-h-[48px] px-6 border border-slate-200 rounded-brand-pill hover:border-slate-300 bg-white"
              >
                Ver flota
              </button>
            </motion.div>

            {/* ── Star rating row ──────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.9, duration: 0.6 }}
              className="flex items-center gap-3"
            >
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-xs text-brand-muted font-medium">
                <span className="text-brand-dark font-bold">4.9</span>
                {" "}· Valorado por 500 clientes en CMN
              </span>
            </motion.div>
          </div>
        </section>

        {/* ================================================================
            2. TRUST STRIP — Marquee light
        ================================================================ */}
        <div className="bg-white border-y border-slate-200 py-5 overflow-hidden">
          <Marquee
            items={MARQUEE_ITEMS}
            speed={24}
            className="text-brand-muted text-xs tracking-[0.18em] uppercase font-medium"
          />
        </div>

        {/* ================================================================
            3. STATS — CountUp cards (light)
        ================================================================ */}
        <section className="py-24 px-6" id="why">
          <div className="max-w-5xl mx-auto">
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="grid grid-cols-1 md:grid-cols-3 gap-5"
            >
              {STATS.map((stat) => (
                <motion.div key={stat.label} variants={fadeUp}>
                  <SpotlightCard
                    spotlightColor="rgba(37,99,235,0.06)"
                    className="bg-white border border-slate-200 rounded-2xl p-8 hover:shadow-lg hover:border-blue-200 transition-all duration-500 cursor-default"
                  >
                    <p className="text-5xl md:text-6xl font-black text-brand-primary tracking-tighter mb-3 tabular-nums">
                      <CountUp
                        to={stat.to}
                        prefix={stat.prefix ?? ""}
                        suffix={stat.suffix}
                        duration={2.2}
                      />
                    </p>
                    <p className="text-brand-muted text-xs uppercase tracking-[0.18em] font-medium">
                      {stat.label}
                    </p>
                  </SpotlightCard>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ================================================================
            4. FEATURES BENTO — 3 cards
        ================================================================ */}
        <section className="px-6 pb-24">
          <div className="max-w-5xl mx-auto">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="text-center mb-12"
            >
              <p className="text-xs text-brand-muted uppercase tracking-[0.2em] font-medium mb-3">
                Por qué Casablanca
              </p>
              <h2 className="text-4xl md:text-5xl font-bold text-brand-dark tracking-tight">
                El alquiler, reinventado.
              </h2>
            </motion.div>

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className="grid grid-cols-1 md:grid-cols-2 gap-5"
            >
              {/* Card grande — dark */}
              <motion.div variants={fadeUp} className="md:col-span-2">
                <div className="rounded-2xl bg-brand-dark text-white p-10 flex flex-col md:flex-row items-start md:items-center gap-8">
                  <div className="w-12 h-12 rounded-xl bg-brand-primary/20 border border-brand-primary/30 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-brand-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Micro-pago</p>
                    <h3 className="font-black leading-tight mb-3" style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}>
                      Solo <span className="text-brand-primary">10EUR</span> para
                      <br />
                      asegurar tu reserva.
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed max-w-lg">
                      Bloquea tu vehículo con una micro-transacción. El saldo restante lo abonas
                      de forma transparente al llegar. Sin cargos ocultos.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Card — emerald */}
              <motion.div variants={fadeUp}>
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-8 h-full">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center mb-6">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-brand-dark mb-3 leading-tight">
                    Check-in 100% Digital.
                  </h3>
                  <p className="text-brand-muted text-sm leading-relaxed">
                    Verifica tu pasaporte desde casa antes de aterrizar. Cero burocracia
                    en el mostrador. Solo recibes tu llave.
                  </p>
                </div>
              </motion.div>

              {/* Card — blue */}
              <motion.div variants={fadeUp}>
                <div className="rounded-2xl bg-blue-50 border border-blue-200 p-8 h-full">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center mb-6">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-brand-dark mb-3 leading-tight">
                    30 segundos. Listo para conducir.
                  </h3>
                  <p className="text-brand-muted text-sm leading-relaxed">
                    Aterriza · Escanea QR · Conduce. Nuestro proceso elimina
                    las colas y te pone en ruta en tiempo récord.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ================================================================
            5. FLEET — Light section
        ================================================================ */}
        <section id="fleet" className="bg-white border-t border-slate-200 py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="text-center mb-14"
            >
              <p className="text-xs text-brand-muted uppercase tracking-[0.2em] font-medium mb-4">
                Flota Premium
              </p>
              <h2 className="text-4xl md:text-5xl font-bold text-brand-dark tracking-tight mb-4">
                Elige tu coche.
              </h2>
              <p className="text-brand-muted text-base max-w-md mx-auto leading-relaxed">
                Cada vehículo incluye SIM 5G, Tag Jawaz para peajes
                y seguro a todo riesgo. Sin costes extra.
              </p>
            </motion.div>

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
            >
              {VEHICLES.map((v) => (
                <motion.div
                  key={v.model}
                  variants={fadeUp}
                  className="rounded-brand-card overflow-hidden transition-shadow duration-500 hover:shadow-lg"
                >
                  <TrustCard
                    model={v.model}
                    totalPrice={v.totalPrice}
                    imageUrl={v.imageUrl}
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

      </div>
    </>
  );
}
