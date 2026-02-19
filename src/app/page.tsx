"use client";

import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import { ArrowDown, ArrowRight, Clock, ShieldCheck, Zap } from "lucide-react";
import TrustCard from "@/components/vehicles/TrustCard";
import Aurora from "@/components/ui/Aurora";
import CountUp from "@/components/ui/CountUp";
import DecryptedText from "@/components/ui/DecryptedText";
import MagneticButton from "@/components/ui/MagneticButton";
import Marquee from "@/components/ui/Marquee";
import Noise from "@/components/ui/Noise";
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
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

/* -- Gradient text helper -------------------------------------------------- */

const gradientStyle: CSSProperties = {
  background: "linear-gradient(90deg, #60A5FA 0%, #A78BFA 50%, #22D3EE 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

/* ========================================================================== */

export default function Home() {
  const scrollToFleet = () =>
    document.getElementById("fleet")?.scrollIntoView({ behavior: "smooth" });

  const scrollToWhy = () =>
    document.getElementById("why")?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="relative w-full bg-[#060910]">

      {/* ================================================================
          1. HERO - Full-viewport dark experience
      ================================================================ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        <Aurora />
        <Noise opacity={0.045} />

        {/* Radial vignette */}
        <div
          aria-hidden
          className="absolute inset-0 z-[3] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 40%, #060910 100%)",
          }}
        />

        <div className="relative z-10 flex flex-col items-center text-center px-4 w-full max-w-6xl">

          {/* Live dot + badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] as const }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-xs text-white/55 tracking-[0.2em] uppercase font-medium mb-12"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse flex-shrink-0" />
            CMN · Mohammed V Airport · Est. 2026
          </motion.div>

          {/* Massive headline */}
          <div className="mb-8">
            <h1
              className="font-black tracking-[-0.05em] leading-[0.88] text-white uppercase select-none"
              style={{ fontSize: "clamp(5rem, 18vw, 16rem)" }}
            >
              <DecryptedText text="NEXUS" speed={28} />
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8, ease: [0.22, 1, 0.36, 1] as const }}
              className="font-bold tracking-tight leading-none mt-2"
              style={{
                fontSize: "clamp(1.1rem, 3.5vw, 2.5rem)",
                ...gradientStyle,
              }}
            >
              Premium · Sin Filas · Casablanca
            </motion.p>
          </div>

          {/* Copy */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.95, duration: 1 }}
            className="text-base md:text-lg text-white/40 max-w-md font-light mb-12 leading-relaxed"
          >
            Tu coche de lujo te espera en el aeropuerto.
            <br />
            Reserva con 10EUR. Sin burocracia. Sin sorpresas.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <MagneticButton
              onClick={scrollToFleet}
              className="group flex items-center gap-3 bg-white text-[#060910] font-bold text-sm px-8 py-4 rounded-full min-h-[52px] shadow-[0_0_60px_rgba(96,165,250,0.25)] hover:shadow-[0_0_90px_rgba(96,165,250,0.45)] transition-shadow"
            >
              <span>Reservar ahora</span>
              <span className="font-black text-blue-600">· 10EUR</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </MagneticButton>

            <button
              type="button"
              onClick={scrollToWhy}
              className="text-white/35 hover:text-white/70 text-xs tracking-[0.2em] uppercase font-medium transition-colors min-h-[48px] px-6"
            >
              Descubrir mas
            </button>
          </motion.div>

          {/* Mini stats row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="flex flex-wrap justify-center items-center gap-6 mt-16 text-white/25 text-xs tracking-widest uppercase"
          >
            <span>500+ clientes</span>
            <span className="w-px h-3 bg-white/10" />
            <span>24h soporte</span>
            <span className="w-px h-3 bg-white/10" />
            <span>10EUR reserva</span>
          </motion.div>
        </div>

        {/* Scroll chevron */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2 }}
          className="absolute bottom-10 z-10 flex flex-col items-center gap-2 text-white/18"
        >
          <motion.div
            animate={{ y: [0, 7, 0] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" as const }}
          >
            <ArrowDown className="w-4 h-4" />
          </motion.div>
        </motion.div>
      </section>

      {/* ================================================================
          2. MARQUEE - Infinite trust-signal strip
      ================================================================ */}
      <div className="border-y border-white/6 py-5 overflow-hidden">
        <Marquee
          items={MARQUEE_ITEMS}
          speed={24}
          className="text-white/35 text-xs tracking-[0.18em] uppercase font-medium"
        />
      </div>

      {/* ================================================================
          3. STATS - Animated CountUp numbers
      ================================================================ */}
      <section className="py-28 px-6" id="why">
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
                  spotlightColor="rgba(96,165,250,0.09)"
                  className="border border-white/8 rounded-3xl p-8 bg-white/[0.03] hover:border-blue-500/25 hover:bg-white/[0.05] transition-all duration-500 cursor-default"
                >
                  <p className="text-5xl md:text-6xl font-black text-white tracking-tighter mb-3 tabular-nums">
                    <CountUp
                      to={stat.to}
                      prefix={stat.prefix ?? ""}
                      suffix={stat.suffix}
                      duration={2.2}
                    />
                  </p>
                  <p className="text-white/35 text-xs uppercase tracking-[0.18em] font-medium">
                    {stat.label}
                  </p>
                </SpotlightCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ================================================================
          4. WHY NEXUS - SpotlightCard Bento
      ================================================================ */}
      <section className="px-6 pb-28">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-1">
              La redefinicion del
            </h2>
            <h2
              className="text-4xl md:text-6xl font-bold tracking-tight"
              style={gradientStyle}
            >
              alquiler.
            </h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            {/* Micro-payment card */}
            <motion.div variants={fadeUp}>
              <SpotlightCard
                spotlightColor="rgba(96,165,250,0.11)"
                className="rounded-3xl border border-white/8 bg-white/[0.03] hover:border-blue-500/20 transition-all duration-500 cursor-default h-full"
              >
                <div className="p-10">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/14 border border-blue-500/18 flex items-center justify-center mb-8">
                    <Zap className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4 leading-tight">
                    Bloquea por solo 10EUR.
                  </h3>
                  <p className="text-white/40 text-sm leading-relaxed">
                    Asegura tu vehiculo con una micro-transaccion. El saldo
                    restante lo abonas de forma transparente al llegar. Sin
                    cargos ocultos.
                  </p>
                </div>
              </SpotlightCard>
            </motion.div>

            {/* Digital check-in card */}
            <motion.div variants={fadeUp}>
              <SpotlightCard
                spotlightColor="rgba(167,139,250,0.11)"
                className="rounded-3xl border border-white/8 bg-white/[0.03] hover:border-violet-500/20 transition-all duration-500 cursor-default h-full"
              >
                <div className="p-10">
                  <div className="w-12 h-12 rounded-2xl bg-violet-500/14 border border-violet-500/18 flex items-center justify-center mb-8">
                    <ShieldCheck className="w-5 h-5 text-violet-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4 leading-tight">
                    Check-in 100% Digital.
                  </h3>
                  <p className="text-white/40 text-sm leading-relaxed">
                    Verifica tu pasaporte desde casa antes de aterrizar. Cero
                    burocracia en el mostrador. Solo recibes tu llave.
                  </p>
                </div>
              </SpotlightCard>
            </motion.div>

            {/* Wide process card */}
            <motion.div variants={fadeUp} className="md:col-span-2">
              <SpotlightCard
                spotlightColor="rgba(34,211,238,0.08)"
                className="rounded-3xl border border-white/8 bg-white/[0.03] hover:border-cyan-500/15 transition-all duration-500 cursor-default"
              >
                <div className="p-10 flex flex-col md:flex-row items-start md:items-center gap-8">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/14 border border-cyan-500/18 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-3 leading-tight">
                      Tu coche, listo en 30 segundos.
                    </h3>
                    <p className="text-white/40 text-sm leading-relaxed max-w-2xl">
                      Aterriza · Escanea tu QR · Recibe las llaves. Nuestro
                      proceso elimina las colas tradicionales y te pone en ruta
                      en tiempo record.
                    </p>
                  </div>
                  <div
                    aria-hidden
                    className="text-7xl font-black tracking-tighter select-none hidden md:block flex-shrink-0"
                    style={{ color: "rgba(255,255,255,0.06)" }}
                  >
                    30s
                  </div>
                </div>
              </SpotlightCard>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================
          5. FLEET - Light slab slides over dark section
      ================================================================ */}
      <section
        id="fleet"
        className="relative bg-brand-bg rounded-t-[3.5rem] shadow-[0_-28px_80px_rgba(0,0,0,0.55)] py-28 px-6"
      >
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="text-center mb-16"
          >
            <p className="text-xs text-brand-muted uppercase tracking-[0.2em] font-medium mb-4">
              Flota seleccionada
            </p>
            <h2 className="text-4xl md:text-6xl font-bold text-brand-dark tracking-tight mb-5">
              Elige tu coche.
            </h2>
            <p className="text-brand-muted text-base max-w-lg mx-auto leading-relaxed">
              Cada vehiculo incluye SIM 5G, Tag Jawaz para peajes
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
                className="rounded-brand-card overflow-hidden transition-shadow duration-500 hover:shadow-[0_0_40px_rgba(37,99,235,0.12)]"
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
