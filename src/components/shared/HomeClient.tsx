"use client";

import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import { ArrowRight, Car, Clock, CreditCard, QrCode, ShieldCheck, Smartphone, Star, Zap } from "lucide-react";
import React, { useCallback } from "react";
import BookingPanel from "@/components/shared/BookingPanel";
import CountUp from "@/components/ui/CountUp";
import Marquee from "@/components/ui/Marquee";

// ── Static data ───────────────────────────────────────────────

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

const STEPS = [
  { n: "1", label: "Aterriza" },
  { n: "2", label: "Escanea QR" },
  { n: "3", label: "Conduce", accent: true },
];

const METRICS: Array<{ to: number; suffix: string; label: string }> = [
  { to: 3, suffix: " min", label: "Tiempo de recogida" },
  { to: 10, suffix: "€", label: "Para reservar" },
  { to: 24, suffix: "/7", label: "Soporte en CMN" },
  { to: 100, suffix: "%", label: "Check-in digital" },
];

const PROCESS_STEPS: Array<{
  Icon: React.ElementType;
  title: string;
  description: string;
}> = [
  {
    Icon: Smartphone,
    title: "Reserva en 2 min",
    description:
      "Elige tu categoría y bloquea el coche con solo 10€. Todo desde el móvil, antes de aterrizar.",
  },
  {
    Icon: QrCode,
    title: "Aterriza y escanea",
    description:
      "Al llegar al aeropuerto escaneas el QR de tu ticket. Te identificamos al instante, sin papel.",
  },
  {
    Icon: Car,
    title: "Conduce",
    description:
      "Recoge las llaves y sal a carretera en menos de 3 minutos. Sin colas, sin burocracia.",
  },
];

const FLEET_CATEGORIES: Array<{
  name: string;
  example: string;
  fromPrice: number;
  imageUrl: string;
  badge: string | null;
}> = [
  {
    name: "Compacto",
    example: "VW Polo o similar",
    fromPrice: 45,
    imageUrl:
      "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?q=80&w=800&auto=format&fit=crop",
    badge: "Más económico",
  },
  {
    name: "SUV",
    example: "Hyundai Tucson o similar",
    fromPrice: 85,
    imageUrl:
      "https://images.unsplash.com/photo-1519245659620-e859806a8d3b?q=80&w=800&auto=format&fit=crop",
    badge: "Más popular",
  },
  {
    name: "Premium",
    example: "Audi A4 o similar",
    fromPrice: 120,
    imageUrl:
      "https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?q=80&w=800&auto=format&fit=crop",
    badge: null,
  },
  {
    name: "Berlina",
    example: "Mercedes Clase C o similar",
    fromPrice: 140,
    imageUrl:
      "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=800&auto=format&fit=crop",
    badge: null,
  },
];

const WHY_ITEMS: Array<{
  Icon: React.ElementType;
  title: string;
  description: string;
}> = [
  {
    Icon: Zap,
    title: "3 minutos a bordo",
    description:
      "Nuestro proceso digitalizado elimina las colas del mostrador. Aterriza, escanea y conduce.",
  },
  {
    Icon: ShieldCheck,
    title: "Check-in 100% digital",
    description:
      "Verifica tu documentación antes de llegar. Al aterrizar, solo recoges las llaves.",
  },
  {
    Icon: CreditCard,
    title: "Solo 10€ para reservar",
    description:
      "Bloquea tu vehículo con una micro-transacción. El resto lo abonas al recoger el coche.",
  },
];

const TESTIMONIALS = [
  {
    name: "Carlos M.",
    route: "CMN → Casablanca",
    rating: 5,
    text: "Aterricé, escaneé el QR de mi ticket y en 3 minutos estaba conduciendo. No lo podía creer.",
  },
  {
    name: "Sophie L.",
    route: "CMN → Marrakech",
    rating: 5,
    text: "Precio claro, sin sorpresas. Lo reservé desde el avión y el coche estaba listo al aterrizar.",
  },
  {
    name: "Ahmed B.",
    route: "CMN → Rabat",
    rating: 5,
    text: "El coche estaba limpio y perfecto. Equipo siempre disponible en el aeropuerto. Muy profesional.",
  },
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
            3. TRUST METRICS
        ========================================================== */}
        <section className="bg-white py-14 px-6 border-t border-slate-100">
          <div className="max-w-5xl mx-auto">
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-x divide-slate-100"
            >
              {METRICS.map((m) => (
                <motion.div
                  key={m.label}
                  variants={fadeUp}
                  className="flex flex-col items-center text-center py-4 px-4"
                >
                  <p className="text-4xl md:text-5xl font-black text-brand-primary tracking-tighter tabular-nums mb-2">
                    <CountUp to={m.to} duration={2.2} suffix={m.suffix} />
                  </p>
                  <p className="text-brand-muted text-[11px] font-semibold uppercase tracking-[0.15em]">
                    {m.label}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ==========================================================
            4. HOW IT WORKS
        ========================================================== */}
        <section className="bg-slate-50 py-24 px-6 border-y border-slate-100">
          <div className="max-w-5xl mx-auto">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="text-center mb-16"
            >
              <p className="text-xs text-brand-muted uppercase tracking-[0.2em] font-semibold mb-3">
                Más simple imposible
              </p>
              <h2 className="text-4xl md:text-5xl font-bold text-brand-dark tracking-tight">
                Tu coche en 3 pasos.
              </h2>
            </motion.div>

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 relative"
            >
              {/* Connecting line — desktop only */}
              <div
                aria-hidden
                className="hidden md:block absolute top-[28px] left-[calc(16.66%+28px)] right-[calc(16.66%+28px)] h-px bg-slate-200 z-0"
              />

              {PROCESS_STEPS.map((step, i) => (
                <motion.div
                  key={step.title}
                  variants={fadeUp}
                  className="relative z-10 flex flex-col items-center text-center"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${
                      i === 2
                        ? "bg-brand-primary text-white shadow-[0_8px_24px_rgba(37,99,235,0.22)]"
                        : "bg-white border border-slate-200 text-brand-primary shadow-sm"
                    }`}
                  >
                    <step.Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold text-brand-muted tracking-[0.2em] uppercase mb-2">
                    Paso {i + 1}
                  </span>
                  <h3 className="text-xl font-bold text-brand-dark mb-3">{step.title}</h3>
                  <p className="text-brand-muted text-sm leading-relaxed max-w-[220px]">
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ==========================================================
            5. FLEET CATEGORIES
        ========================================================== */}
        <section id="fleet" className="bg-white py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12"
            >
              <div>
                <p className="text-xs text-brand-muted uppercase tracking-[0.2em] font-semibold mb-3">
                  Flota Premium — CMN
                </p>
                <h2 className="text-4xl md:text-5xl font-bold text-brand-dark tracking-tight">
                  Elige tu categoría.
                </h2>
              </div>
              <a
                href="/catalog"
                className="inline-flex items-center gap-2 text-brand-primary text-sm font-semibold hover:gap-3 transition-all duration-200"
              >
                Ver todos los coches <ArrowRight className="w-4 h-4" />
              </a>
            </motion.div>

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5"
            >
              {FLEET_CATEGORIES.map((cat) => (
                <motion.a
                  key={cat.name}
                  href="/catalog"
                  variants={fadeUp}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] as const }}
                  className="group relative rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 hover:shadow-xl hover:shadow-slate-200/60 transition-shadow duration-300 cursor-pointer block"
                >
                  {cat.badge && (
                    <span className="absolute top-3 left-3 z-10 text-[10px] font-bold uppercase tracking-wider bg-brand-primary text-white px-2.5 py-1 rounded-full">
                      {cat.badge}
                    </span>
                  )}
                  <div className="relative overflow-hidden h-44">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cat.imageUrl}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent" />
                  </div>
                  <div className="p-5">
                    <p className="text-[11px] text-brand-muted font-medium uppercase tracking-wider mb-1">
                      {cat.example}
                    </p>
                    <h3 className="text-xl font-bold text-brand-dark mb-3">{cat.name}</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs text-brand-muted">Desde </span>
                        <span className="text-xl font-black text-brand-primary">{cat.fromPrice}€</span>
                        <span className="text-xs text-brand-muted">/día</span>
                      </div>
                      <span className="text-brand-primary text-sm font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        Ver <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </motion.a>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ==========================================================
            6. WHY NEXUS
        ========================================================== */}
        <section id="why" className="bg-blue-50 border-y border-blue-100 py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="text-center mb-14"
            >
              <p className="text-xs text-brand-muted uppercase tracking-[0.2em] font-semibold mb-3">
                Por qué NEXUS.
              </p>
              <h2 className="text-4xl md:text-5xl font-bold text-brand-dark tracking-tight">
                El alquiler, reinventado.
              </h2>
            </motion.div>

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {WHY_ITEMS.map((item) => (
                <motion.div
                  key={item.title}
                  variants={fadeUp}
                  className="bg-white rounded-2xl p-8 border border-slate-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-6">
                    <item.Icon className="w-5 h-5 text-brand-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-brand-dark mb-3">{item.title}</h3>
                  <p className="text-brand-muted text-sm leading-relaxed">{item.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ==========================================================
            7. TESTIMONIALS
        ========================================================== */}
        <section className="bg-white py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="text-center mb-14"
            >
              <p className="text-xs text-brand-muted uppercase tracking-[0.2em] font-semibold mb-3">
                Clientes reales · Experiencias reales
              </p>
              <h2 className="text-4xl md:text-5xl font-bold text-brand-dark tracking-tight">
                Ellos ya condujeron.
              </h2>
            </motion.div>

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {TESTIMONIALS.map((t) => (
                <motion.div
                  key={t.name}
                  variants={fadeUp}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-8 flex flex-col"
                >
                  <div className="flex gap-0.5 mb-5">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-brand-dark text-[15px] leading-relaxed font-medium flex-1 mb-6">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary font-bold text-sm flex-shrink-0">
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="text-brand-dark font-semibold text-sm leading-none mb-0.5">
                        {t.name}
                      </p>
                      <p className="text-brand-muted text-xs">{t.route}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

      </div>
    </>
  );
}
