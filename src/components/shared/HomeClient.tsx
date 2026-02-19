"use client";

import { AnimatePresence, motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import { ArrowRight, Clock, Key, Plane, QrCode, ShieldCheck, Star, Zap } from "lucide-react";
import { useCallback, useState } from "react";
import IntroSplash from "@/components/shared/IntroSplash";
import BookingPanel from "@/components/shared/BookingPanel";
import CountUp from "@/components/ui/CountUp";
import MagneticButton from "@/components/ui/MagneticButton";
import Marquee from "@/components/ui/Marquee";
import SpotlightCard from "@/components/ui/SpotlightCard";
import TrustCard from "@/components/vehicles/TrustCard";

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
  const [introVisible, setIntroVisible] = useState(true);

  // Mouse spotlight
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
      {/* Intro splash */}
      <AnimatePresence>
        {introVisible && (
          <IntroSplash key="intro" onDone={() => setIntroVisible(false)} />
        )}
      </AnimatePresence>

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
              opacity: 0.75,
            }}
          />

          {/* Color radials */}
          <div
            aria-hidden
            className="absolute top-0 right-0 w-[700px] h-[700px] pointer-events-none z-[1]"
            style={{
              background: "radial-gradient(ellipse at top right, rgba(37,99,235,0.16) 0%, transparent 62%)",
            }}
          />
          <div
            aria-hidden
            className="absolute bottom-0 left-0 w-[500px] h-[500px] pointer-events-none z-[1]"
            style={{
              background: "radial-gradient(ellipse at bottom left, rgba(16,185,129,0.11) 0%, transparent 60%)",
            }}
          />

          {/* ── Floating badges (desktop) ─────────────── */}
          <motion.div
            className="absolute top-[22%] left-[6%] xl:left-[8%] hidden lg:block z-10"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}
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
            className="absolute top-[18%] right-[6%] xl:right-[8%] hidden lg:block z-10"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2.4, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}
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
            className="absolute bottom-[28%] left-[5%] xl:left-[8%] hidden lg:block z-10"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2.6, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}
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
            className="absolute bottom-[30%] right-[5%] xl:right-[8%] hidden lg:block z-10"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2.8, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}
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
                transition={{ delay: 1.9, duration: 0.55, ease: [0.22, 1, 0.36, 1] as const }}
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

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.65, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
                className="text-base md:text-lg text-brand-muted max-w-sm mb-10 leading-relaxed"
              >
                Sin filas. Sin papel. Solo tú y la carretera.
              </motion.p>

              {/* CTA (mobile only — desktop uses BookingPanel) */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.75, duration: 0.55, ease: [0.22, 1, 0.36, 1] as const }}
                className="flex flex-col sm:flex-row items-center gap-4 mb-10 lg:hidden"
              >
                <MagneticButton
                  onClick={scrollToFleet}
                  className="group relative overflow-hidden flex items-center gap-3 bg-brand-primary text-white font-bold text-sm px-8 py-4 rounded-brand-pill min-h-[52px] shadow-[0_4px_24px_rgba(37,99,235,0.30)]"
                >
                  <motion.span
                    aria-hidden
                    className="absolute inset-0 -skew-x-12 pointer-events-none"
                    style={{
                      background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.22) 50%, transparent 100%)",
                    }}
                    animate={{ x: ["-120%", "220%"] }}
                    transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 2.8, ease: "easeInOut" }}
                  />
                  <span className="relative">Reservar ahora</span>
                  <span className="relative font-black opacity-75">· 10€</span>
                  <ArrowRight className="relative w-4 h-4 transition-transform group-hover:translate-x-1" />
                </MagneticButton>

                <button
                  type="button"
                  onClick={scrollToFleet}
                  className="text-brand-muted hover:text-brand-dark text-xs tracking-[0.18em] uppercase font-semibold transition-colors min-h-[48px] px-6 border border-slate-200 rounded-brand-pill bg-white"
                >
                  Ver flota
                </button>
              </motion.div>

              {/* Star rating row */}
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
                  {" "}· Beta · CMN
                </span>
              </motion.div>
            </div>

            {/* ── Booking Panel (desktop right side) ──── */}
            <motion.div
              className="w-full max-w-sm hidden lg:block"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 2.0, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}
            >
              <BookingPanel />
            </motion.div>
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
            3. STATS
        ========================================================== */}
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

        {/* ==========================================================
            4. FEATURES BENTO
        ========================================================== */}
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
                Por qué NEXUS
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
              <motion.div variants={fadeUp} className="md:col-span-2">
                <div className="rounded-2xl bg-brand-dark text-white p-10 flex flex-col md:flex-row items-start md:items-center gap-8">
                  <div className="w-12 h-12 rounded-xl bg-brand-primary/20 border border-brand-primary/30 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-brand-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Micro-pago</p>
                    <h3 className="font-black leading-tight mb-3" style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}>
                      Solo <span className="text-brand-primary">10€</span> para
                      <br />
                      asegurar tu reserva.
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed max-w-lg">
                      Bloquea tu vehículo con una micro-transacción. El saldo restante lo
                      abonas de forma transparente al llegar. Sin cargos ocultos.
                    </p>
                  </div>
                </div>
              </motion.div>

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

              <motion.div variants={fadeUp}>
                <div className="rounded-2xl bg-blue-50 border border-blue-200 p-8 h-full">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center mb-6">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-brand-dark mb-3 leading-tight">
                    3 minutos. Listo para conducir.
                  </h3>
                  <p className="text-brand-muted text-sm leading-relaxed">
                    Aterriza · Escanea QR · Conduce. Nuestro proceso elimina las colas y
                    te pone en ruta en tiempo récord.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ==========================================================
            5. FLEET
        ========================================================== */}
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
                Cada vehículo incluye SIM 5G, Tag Jawaz para peajes y seguro a todo
                riesgo. Sin costes extra.
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
                  className="rounded-brand-card overflow-hidden"
                >
                  <TrustCard
                    model={v.model}
                    totalPrice={`${v.totalPrice}€`}
                    imageUrl={v.imageUrl}
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

      </div>

      {/* ── Mobile Booking Panel (bottom drawer) ───── */}
      <div className="lg:hidden">
        <BookingPanel />
      </div>
    </>
  );
}
