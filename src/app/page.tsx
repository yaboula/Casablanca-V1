"use client";

import { motion } from "framer-motion";
import { ArrowRight, Clock, ShieldCheck, Zap } from "lucide-react";
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

/* -- Motion variants ------------------------------------------------------- */

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

/* ========================================================================== */

export default function Home() {
  const scrollToFleet = () =>
    document.getElementById("fleet")?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="relative w-full bg-brand-bg">

      {/* ================================================================
          1. HERO — Light, luminous, airport-first
      ================================================================ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4">
        {/* Subtle radial decoration */}
        <div
          aria-hidden
          className="absolute top-0 right-0 w-[600px] h-[600px] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at top right, rgba(37,99,235,0.08) 0%, transparent 65%)",
          }}
        />

        <div className="relative z-10 flex flex-col items-center text-center w-full max-w-2xl">

          {/* Badge pill */}
          <motion.div
            initial={{ y: -12 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-slate-200 bg-white text-xs text-brand-muted tracking-[0.18em] uppercase font-medium mb-10 shadow-sm"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-brand-success animate-pulse flex-shrink-0" />
            CMN · Aeropuerto Mohammed V
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] as const }}
            className="font-black tracking-tight leading-[1] text-brand-dark mb-5"
            style={{ fontSize: "clamp(3rem, 12vw, 6rem)" }}
          >
            Tu coche.
            <br />
            <span className="text-brand-primary">Al instante.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ y: 16 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
            className="text-base md:text-lg text-brand-muted max-w-md mb-10 leading-relaxed"
          >
            Reserva con 10EUR. Check-in digital. Recoge tu llave en 30 segundos.
            <br />
            Sin colas · Sin burocracia.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ y: 16 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.18, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <MagneticButton
              onClick={scrollToFleet}
              className="group flex items-center gap-3 bg-brand-primary text-white font-bold text-sm px-8 py-4 rounded-brand-pill min-h-[52px] shadow-[0_0_40px_rgba(37,99,235,0.25)] hover:shadow-[0_0_60px_rgba(37,99,235,0.38)] hover:bg-brand-primary-hover transition-all"
            >
              <span>Reservar ahora</span>
              <span className="font-black opacity-80">· 10EUR</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </MagneticButton>

            <button
              type="button"
              onClick={scrollToFleet}
              className="text-brand-muted hover:text-brand-dark text-xs tracking-[0.18em] uppercase font-medium transition-colors min-h-[48px] px-6"
            >
              Ver flota
            </button>
          </motion.div>

          {/* Micro-stats row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.8 }}
            className="flex flex-wrap justify-center items-center gap-6 mt-16 text-brand-muted text-xs tracking-widest uppercase"
          >
            <span>500+ clientes</span>
            <span className="w-px h-3 bg-slate-300" />
            <span>24h soporte</span>
            <span className="w-px h-3 bg-slate-300" />
            <span>10EUR reserva</span>
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
          {/* Section header */}
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
            {/* Card grande (col-span-2) — dark accent */}
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
      <section
        id="fleet"
        className="bg-white border-t border-slate-200 py-24 px-6"
      >
        <div className="max-w-6xl mx-auto">

          {/* Header */}
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

          {/* Fleet grid */}
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
  );
}
