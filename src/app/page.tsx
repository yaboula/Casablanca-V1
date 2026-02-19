"use client";

import { motion } from "framer-motion";
import { ArrowRight, Clock, ShieldCheck, Star, Zap } from "lucide-react";
import TrustCard from "@/components/vehicles/TrustCard";
import CountUp from "@/components/ui/CountUp";
import DecryptedText from "@/components/ui/DecryptedText";
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

/* -- Motion variants ------------------------------------------------------- */

/* Word-by-word clip stagger for headline */
const wordContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.13, delayChildren: 0.2 } },
};
const wordItem = {
  hidden: { y: "115%", opacity: 0 },
  visible: {
    y: "0%",
    opacity: 1,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
};

/* Generic section fade-up */
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
          1. HERO — Premium airport-first experience
      ================================================================ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 py-20">

        {/* ── Background: dot grid ───────────────────────────────── */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, #CBD5E1 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            opacity: 0.55,
          }}
        />

        {/* ── Background: color radials ──────────────────────────── */}
        <div
          aria-hidden
          className="absolute top-0 right-0 w-[700px] h-[700px] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at top right, rgba(37,99,235,0.10) 0%, transparent 62%)",
          }}
        />
        <div
          aria-hidden
          className="absolute bottom-0 left-0 w-[500px] h-[500px] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at bottom left, rgba(16,185,129,0.07) 0%, transparent 60%)",
          }}
        />

        {/* ── Floating badges (desktop only) ─────────────────────── */}

        {/* Badge — Precio */}
        <motion.div
          className="absolute top-[22%] left-[6%] xl:left-[12%] hidden lg:block"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}
        >
          <motion.div
            animate={{ y: [0, -9, 0] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut" as const,
              delay: 0.3,
            }}
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

        {/* Badge — Rating */}
        <motion.div
          className="absolute top-[18%] right-[6%] xl:right-[12%] hidden lg:block"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}
        >
          <motion.div
            animate={{ y: [0, -7, 0] }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: "easeInOut" as const,
              delay: 1,
            }}
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

        {/* Badge — Recogida */}
        <motion.div
          className="absolute bottom-[28%] left-[5%] xl:left-[10%] hidden lg:block"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.5, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{
              duration: 4.5,
              repeat: Infinity,
              ease: "easeInOut" as const,
              delay: 0.8,
            }}
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

        {/* Badge — Soporte */}
        <motion.div
          className="absolute bottom-[30%] right-[5%] xl:right-[10%] hidden lg:block"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.7, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{
              duration: 3.8,
              repeat: Infinity,
              ease: "easeInOut" as const,
              delay: 1.5,
            }}
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

        {/* ── Center content ─────────────────────────────────────── */}
        <div className="relative z-10 flex flex-col items-center text-center w-full max-w-3xl">

          {/* Live availability pill */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-slate-200 bg-white shadow-sm text-xs text-brand-muted tracking-[0.16em] uppercase font-semibold mb-10"
          >
            {/* Pulsing live ring */}
            <span className="relative flex h-2 w-2 flex-shrink-0">
              <span className="absolute inline-flex h-full w-full rounded-full bg-brand-success opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-success" />
            </span>
            Disponible · CMN · Aeropuerto Mohammed V
          </motion.div>

          {/* ── Headline — word-by-word clip stagger ─────────────── */}
          <div className="mb-8 w-full">
            {/* Line 1 */}
            <motion.div
              variants={wordContainer}
              initial="hidden"
              animate="visible"
              className="flex flex-wrap justify-center gap-x-[0.3em]"
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

            {/* Line 2 — DecryptedText in brand-primary */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.3 }}
              className="font-black tracking-tight leading-[1.05] text-brand-primary"
              style={{ fontSize: "clamp(3.5rem, 11vw, 6.5rem)" }}
            >
              <DecryptedText
                text="Al instante."
                speed={22}
                delay={600}
                className="font-black tracking-tight"
              />
            </motion.div>
          </div>

          {/* ── 3-step process strip ─────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.55, ease: [0.22, 1, 0.36, 1] as const }}
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

          {/* ── Subtitle ─────────────────────────────────────────── */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
            className="text-base md:text-lg text-brand-muted max-w-sm mb-10 leading-relaxed"
          >
            Sin filas. Sin papel. Solo tú y la carretera.
          </motion.p>

          {/* ── CTA group ────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.72, duration: 0.55, ease: [0.22, 1, 0.36, 1] as const }}
            className="flex flex-col sm:flex-row items-center gap-4 mb-10"
          >
            {/* Primary CTA with shimmer */}
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

          {/* ── Star rating row ──────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.95, duration: 0.6 }}
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

        {/* ── Bottom hero stats strip ────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
          className="absolute bottom-8 left-0 right-0 flex justify-center px-4 z-10"
        >
          <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm border border-slate-200/80 rounded-2xl px-6 py-3 shadow-sm">
            {STATS.map((stat, i) => (
              <span key={stat.label} className="flex items-center gap-4">
                <span className="flex flex-col items-center">
                  <span className="text-xl font-black text-brand-primary tabular-nums leading-none">
                    <CountUp
                      to={stat.to}
                      prefix={stat.prefix ?? ""}
                      suffix={stat.suffix}
                      duration={2}
                    />
                  </span>
                  <span className="text-[10px] text-brand-muted uppercase tracking-widest mt-0.5 whitespace-nowrap">
                    {stat.label}
                  </span>
                </span>
                {i < STATS.length - 1 && (
                  <span className="w-px h-8 bg-slate-200" />
                )}
              </span>
            ))}
          </div>
        </motion.div>
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
  );
}
