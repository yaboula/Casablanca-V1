"use client";

import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowRight, Clock, ShieldCheck, Star, Zap } from "lucide-react";
import { useCallback, useRef } from "react";
import BookingPanel from "@/components/shared/BookingPanel";
import CountUp from "@/components/ui/CountUp";
import Marquee from "@/components/ui/Marquee";

// ── Static data ───────────────────────────────────────────────

const VEHICLES = [
  {
    model: "Audi A4",
    totalPrice: "800",
    pricePerDay: 160,
    imageUrl: "https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?q=80&w=800&auto=format&fit=crop",
  },
  {
    model: "Mercedes Clase C",
    totalPrice: "950",
    pricePerDay: 190,
    imageUrl: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=800&auto=format&fit=crop",
  },
  {
    model: "Range Rover Evoque",
    totalPrice: "1200",
    pricePerDay: 240,
    imageUrl: "https://images.unsplash.com/photo-1519245659620-e859806a8d3b?q=80&w=800&auto=format&fit=crop",
  },
];

const MARQUEE_ITEMS = [
  "Mohammed V Airport",
  "CMN 24/7",
  "Flota Premium",
  "Cero Burocracia",
  "Reserva por 10€",
  "Entrega Inmediata",
  "Check-in Digital",
  "Sin Colas",
];

const STATS: Array<{ to: number; suffix: string; prefix?: string; label: string }> = [
  { to: 3, suffix: " min", label: "Tiempo medio de entrega" },
  { to: 24, suffix: "h", label: "Soporte en CMN" },
  { to: 10, prefix: "€", suffix: "", label: "Para asegurar tu coche" },
];

const STEPS = [
  { n: "1", label: "Aterriza" },
  { n: "2", label: "Escanea QR" },
  { n: "3", label: "Conduce", accent: true },
];

const FLEET_ROWS = [
  { model: "AUDI A4", category: "PREMIUM", status: "DISPONIBLE", price: "160€/día", hot: false },
  { model: "MERCEDES CLASE C", category: "PREMIUM", status: "DISPONIBLE", price: "190€/día", hot: false },
  { model: "BMW SERIE 3", category: "SPORT", status: "DISPONIBLE", price: "180€/día", hot: false },
  { model: "RANGE ROVER EVOQUE", category: "SUV", status: "2 RESTANTES", price: "240€/día", hot: true },
  { model: "HYUNDAI TUCSON", category: "SUV", status: "DISPONIBLE", price: "120€/día", hot: false },
  { model: "RENAULT CLIO", category: "COMPACTO", status: "DISPONIBLE", price: "75€/día", hot: false },
];

// ── Animation variants ────────────────────────────────────────

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

// ── Component ─────────────────────────────────────────────────

export default function HomeClient() {
  // Mouse spotlight
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { damping: 28, stiffness: 100, mass: 0.5 });
  const springY = useSpring(mouseY, { damping: 28, stiffness: 100, mass: 0.5 });
  const spotlightBg = useMotionTemplate`radial-gradient(600px at ${springX}px ${springY}px, rgba(37, 99, 235, 0.13), transparent 75%)`;

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
      <div className="relative w-full bg-brand-bg">

        {/* ==========================================================
            1. HERO
        ========================================================== */}
        <section
          className="relative min-h-screen flex flex-col overflow-hidden px-4 py-20"
          onMouseMove={handleMouseMove}
        >
          {/* Mouse spotlight */}
          <motion.div
            aria-hidden
            className="absolute inset-0 pointer-events-none z-[2]"
            style={{ background: spotlightBg }}
          />

          {/* Dot grid */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none z-[1]"
            style={{
              backgroundImage: "radial-gradient(circle, #94A3B8 1px, transparent 1px)",
              backgroundSize: "28px 28px",
              opacity: 0.45,
            }}
          />

          {/* Color radials */}
          <div
            aria-hidden
            className="absolute top-0 right-0 w-[700px] h-[700px] pointer-events-none z-[1]"
            style={{
              background: "radial-gradient(ellipse at top right, rgba(37,99,235,0.24) 0%, transparent 62%)",
            }}
          />
          <div
            aria-hidden
            className="absolute bottom-0 left-0 w-[500px] h-[500px] pointer-events-none z-[1]"
            style={{
              background: "radial-gradient(ellipse at bottom left, rgba(16,185,129,0.17) 0%, transparent 60%)",
            }}
          />

          {/* ── Floating badges (desktop) ─────────────── */}
          <motion.div
            className="absolute top-[22%] left-[2%] xl:left-[2.5%] hidden lg:block z-10"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}
          >
            <motion.div
              animate={{ y: [0, -9, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
              className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.06)] cursor-default select-none"
            >
              <span className="w-8 h-8 rounded-xl bg-brand-primary flex items-center justify-center text-white text-sm font-black flex-shrink-0">
                €
              </span>
              <div>
                <p className="text-brand-dark font-bold text-sm leading-none">Solo 10€</p>
                <p className="text-brand-muted text-[10px] mt-0.5">Para reservar</p>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            className="absolute top-[18%] right-[2%] xl:right-[2.5%] hidden lg:block z-10"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}
          >
            <motion.div
              animate={{ y: [0, -7, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.06)] cursor-default select-none"
            >
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <div>
                <p className="text-brand-dark font-bold text-sm leading-none">4.9 / 5</p>
                <p className="text-brand-muted text-[10px] mt-0.5">Primeras reservas</p>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            className="absolute bottom-[28%] left-[2%] xl:left-[2.5%] hidden lg:block z-10"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
              className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.06)] cursor-default select-none"
            >
              <span className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-white" />
              </span>
              <div>
                <p className="text-brand-dark font-bold text-sm leading-none">3 minutos</p>
                <p className="text-brand-muted text-[10px] mt-0.5">Tiempo de recogida</p>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            className="absolute bottom-[30%] right-[2%] xl:right-[2.5%] hidden lg:block z-10"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.0, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
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

          {/* ── Hero center + Booking Panel ───────── */}
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16 w-full max-w-7xl mx-auto flex-1 min-h-[80vh]">

            {/* Center content */}
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left w-full max-w-xl flex-1">

              {/* Live availability pill */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.55, ease: [0.22, 1, 0.36, 1] as const }}
                className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-slate-200 bg-white shadow-sm text-xs text-brand-muted tracking-[0.16em] uppercase font-semibold mb-10"
              >
                <span className="relative flex h-2 w-2 flex-shrink-0">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-brand-success opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-success" />
                </span>
                Disponible · CMN · Aeropuerto Mohammed V
              </motion.div>

              {/* Headline */}
              <div className="mb-3 w-full">
                <motion.div
                  variants={wordContainer}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-wrap justify-center lg:justify-start gap-x-[0.28em]"
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

                <motion.div
                  variants={charContainer}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-wrap justify-center lg:justify-start"
                  style={{ fontSize: "clamp(3.5rem, 11vw, 6.5rem)", perspective: "800px" }}
                  aria-label="Al instante."
                >
                  {"Al instante.".split("").map((char, i) => (
                    <span key={i} className="overflow-hidden inline-block" style={{ paddingBottom: "0.05em" }}>
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

              {/* 3-step process strip */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.55, ease: [0.22, 1, 0.36, 1] as const }}
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

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
                className="text-base md:text-lg text-brand-muted max-w-sm mb-10 leading-relaxed"
              >
                Sin filas. Sin papel. Solo tú y la carretera.
              </motion.p>

              {/* Star rating row */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="flex items-center gap-3"
              >
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-xs text-brand-muted font-medium">
                  <span className="text-brand-dark font-bold">4.9</span>
                  {" "}· Beta · CMN
                </span>
              </motion.div>
            </div>

            {/* ── Booking Panel ──── */}
            <div className="w-full lg:max-w-sm">
              <BookingPanel />
            </div>
          </div>
        </section>

        {/* ==========================================================
            2. TRUST STRIP — Marquee
        ========================================================== */}
        <div className="bg-white border-y border-slate-200 py-5 overflow-hidden">
          <Marquee
            items={MARQUEE_ITEMS}
            speed={24}
            className="text-brand-muted text-xs tracking-[0.18em] uppercase font-medium"
          />
        </div>

        {/* ==========================================================
            3 · NEXUS TERMINAL — Dark departure board + HUD
        ========================================================== */}
        <section className="relative bg-[#060D18] text-white overflow-hidden">
          {/* Grid bg */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(rgba(37,99,235,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.06) 1px, transparent 1px)",
              backgroundSize: "64px 64px",
            }}
          />
          {/* Top radial glow */}
          <div
            className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1100px] h-[560px] pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(37,99,235,0.22) 0%, transparent 65%)" }}
          />

          <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-24">
            {/* Status bar */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="flex items-center justify-between mb-16"
            >
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-brand-success animate-pulse" />
                <span className="font-mono text-[10px] tracking-[0.28em] uppercase text-white/40">
                  NEXUS TERMINAL · CMN · SISTEMA ACTIVO
                </span>
              </div>
              <span className="font-mono text-[10px] text-white/20 hidden md:block tracking-widest">
                24H · T1 &amp; T2
              </span>
            </motion.div>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-12 xl:gap-20 items-start">

              {/* ── Departure board ── */}
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="flex items-center justify-between mb-3"
                >
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/25">
                    ▸ DISPONIBILIDAD DE FLOTA — HOY
                  </span>
                  <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="font-mono text-[10px] text-brand-success tracking-widest"
                  >
                    ● EN VIVO
                  </motion.span>
                </motion.div>

                {/* Table header */}
                <div className="grid grid-cols-[28px_1fr_auto_88px] gap-3 px-4 py-2.5 border-b border-white/10 mb-px">
                  {["#", "VEHÍCULO", "ESTADO", "TARIFA"].map((h) => (
                    <span key={h} className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/20">{h}</span>
                  ))}
                </div>

                {FLEET_ROWS.map((row, i) => (
                  <motion.a
                    key={row.model}
                    href="/catalog"
                    initial={{ opacity: 0, x: -18 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.06 * i, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ x: 6, backgroundColor: "rgba(37,99,235,0.07)" }}
                    className="grid grid-cols-[28px_1fr_auto_88px] gap-3 px-4 py-4 border-b border-white/[0.06] items-center rounded-xl cursor-pointer group transition-colors"
                  >
                    <span className="font-mono text-[10px] text-white/20">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <p className="text-sm font-bold text-white group-hover:text-brand-primary transition-colors tracking-wide">
                        {row.model}
                      </p>
                      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/25 mt-0.5">
                        {row.category}
                      </p>
                    </div>
                    <span
                      className={`text-[9px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                        row.hot
                          ? "text-amber-400 border-amber-400/30 bg-amber-400/10"
                          : "text-brand-success border-brand-success/30 bg-brand-success/10"
                      }`}
                    >
                      {row.status}
                    </span>
                    <span className="font-mono text-sm font-black text-white/50 text-right">{row.price}</span>
                  </motion.a>
                ))}
              </div>

              {/* ── HUD Stats ── */}
              <div className="space-y-4 xl:sticky xl:top-24">
                {STATS.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.94 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.12 + 0.2, duration: 0.5 }}
                    className="border border-white/8 rounded-2xl p-5 relative overflow-hidden group hover:border-brand-primary/30 transition-colors"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-white/30 mb-2">
                      {stat.label}
                    </p>
                    <p className="text-4xl font-black text-white tabular-nums leading-none">
                      <CountUp to={stat.to} prefix={stat.prefix ?? ""} suffix={stat.suffix} duration={2} />
                    </p>
                    <div className="mt-4 h-px bg-white/6 overflow-hidden rounded-full">
                      <motion.div
                        className="h-full bg-gradient-to-r from-brand-primary to-brand-success"
                        initial={{ scaleX: 0, originX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.15 + 0.6, duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                  </motion.div>
                ))}

                <motion.a
                  href="/catalog"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.55, duration: 0.4 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center justify-center gap-2 w-full min-h-[54px] bg-brand-primary
                             text-white font-black text-sm rounded-2xl
                             shadow-[0_0_40px_rgba(37,99,235,0.38)] hover:shadow-[0_0_60px_rgba(37,99,235,0.55)]
                             transition-shadow"
                >
                  Reservar ahora
                  <ArrowRight className="w-4 h-4" />
                </motion.a>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================================
            4 · FLEET — 3D perspective hover cards
        ========================================================== */}
        <section id="fleet" className="bg-[#060D18] py-24 px-6 border-t border-white/[0.06]">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12 flex items-end justify-between"
            >
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/25 mb-3">
                  FLOTA PREMIUM · CMN
                </p>
                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                  Elige tu coche.
                </h2>
              </div>
              <a
                href="/catalog"
                className="hidden md:flex items-center gap-1.5 text-sm font-semibold text-white/35 hover:text-white transition-colors"
              >
                Ver todos <ArrowRight className="w-4 h-4" />
              </a>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {VEHICLES.map((v, i) => (
                <FleetCard3D key={v.model} vehicle={v} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* ==========================================================
            5 · WHY — Clean feature strip (light)
        ========================================================== */}
        <section id="why" className="bg-white py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  Icon: Zap,
                  n: "01",
                  title: "Solo 10€\npara reservar.",
                  body: "Bloquea tu coche con una micro-transacción. El resto lo pagas al llegar. Sin cargos ocultos.",
                  accent: "text-brand-primary",
                  bg: "bg-brand-primary/5 border-brand-primary/15",
                },
                {
                  Icon: ShieldCheck,
                  n: "02",
                  title: "Check-in 100%\ndigital.",
                  body: "Verifica tu pasaporte antes de aterrizar. Cero burocracia en el mostrador.",
                  accent: "text-brand-success",
                  bg: "bg-emerald-50 border-emerald-200/60",
                },
                {
                  Icon: Clock,
                  n: "03",
                  title: "3 minutos.\nEn ruta.",
                  body: "Aterriza · Escanea QR · Conduce. El proceso más rápido de Marruecos.",
                  accent: "text-amber-500",
                  bg: "bg-amber-50 border-amber-200/60",
                },
              ].map((f, i) => (
                <motion.div
                  key={f.n}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className={`rounded-2xl border p-7 ${f.bg}`}
                >
                  <div className="flex items-start justify-between mb-5">
                    <f.Icon className={`w-5 h-5 ${f.accent}`} />
                    <span className={`font-mono text-[10px] tracking-widest ${f.accent} opacity-40`}>{f.n}</span>
                  </div>
                  <h3 className="text-xl font-black text-brand-dark tracking-tight leading-tight mb-3 whitespace-pre-line">
                    {f.title}
                  </h3>
                  <p className="text-sm text-brand-muted leading-relaxed">{f.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </>
  );
}

// ── 3D Fleet Card ─────────────────────────────────────────────

function FleetCard3D({
  vehicle,
  index,
}: {
  vehicle: (typeof VEHICLES)[0];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 180, damping: 28 });
  const sy = useSpring(y, { stiffness: 180, damping: 28 });
  const rotX = useTransform(sy, [-0.5, 0.5], [7, -7]);
  const rotY = useTransform(sx, [-0.5, 0.5], [-7, 7]);
  const glowX = useTransform(sx, [-0.5, 0.5], [15, 85]);
  const glowY = useTransform(sy, [-0.5, 0.5], [15, 85]);
  const glow = useMotionTemplate`radial-gradient(320px at ${glowX}% ${glowY}%, rgba(37,99,235,0.2), transparent 80%)`;

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }
  function onMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      style={{ perspective: "1000px" }}
    >
      <motion.div
        ref={ref}
        style={{ rotateX: rotX, rotateY: rotY, transformStyle: "preserve-3d" }}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        className="relative rounded-2xl overflow-hidden bg-[#0A1628] border border-white/8
                   cursor-pointer group hover:border-brand-primary/25 transition-colors"
      >
        {/* Spotlight following cursor */}
        <motion.div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{ background: glow }}
        />

        {/* Vehicle image */}
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={vehicle.imageUrl}
            alt={vehicle.model}
            className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A1628] via-[#0A1628]/10 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 p-6">
          <p className="text-white font-black text-lg tracking-tight mb-0.5">{vehicle.model}</p>
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/25 mb-5">
            DISPONIBLE · CMN T1 &amp; T2
          </p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[9px] text-white/30 font-mono uppercase tracking-wider mb-1">desde</p>
              <p className="text-3xl font-black text-white tabular-nums leading-none">
                {vehicle.pricePerDay}
                <span className="text-base font-medium text-white/40">€</span>
                <span className="text-xs font-normal text-white/25">/día</span>
              </p>
            </div>
            <motion.a
              href="/catalog"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2.5 bg-brand-primary text-white text-xs font-black rounded-full
                         shadow-[0_0_20px_rgba(37,99,235,0.45)] hover:shadow-[0_0_32px_rgba(37,99,235,0.65)]
                         transition-shadow"
            >
              Reservar →
            </motion.a>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
