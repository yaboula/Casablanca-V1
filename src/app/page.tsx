"use client";

import { motion } from "framer-motion";
import { CreditCard, Key, Wifi, Zap } from "lucide-react";
import TrustCard from "@/components/vehicles/TrustCard";

/* ── Data ────────────────────────────────────────────────── */

const VEHICLES = [
  {
    model: "Audi A4",
    totalPrice: "800€",
    imageUrl:
      "https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?q=80&w=800&auto=format&fit=crop",
  },
  {
    model: "Mercedes Clase C",
    totalPrice: "950€",
    imageUrl:
      "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=800&auto=format&fit=crop",
  },
  {
    model: "Range Rover Evoque",
    totalPrice: "1.200€",
    imageUrl:
      "https://images.unsplash.com/photo-1519245659620-e859806a8d3b?q=80&w=800&auto=format&fit=crop",
  },
];

const HERO_WORDS = ["Aterriza.", "Conduce.", "Cero Burocracia."];

/* ── Motion variants ─────────────────────────────────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

/* ── Component ───────────────────────────────────────────── */

export default function Home() {
  return (
    <main className="flex flex-col w-full overflow-hidden">

      {/* ─── SECTION 1 · Hero Cinético ───────────────────── */}
      <section className="relative min-h-[85vh] flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-brand-bg to-brand-bg px-4 sm:px-6">
        <motion.div
          className="text-center max-w-4xl mx-auto flex flex-col items-center"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* Badge pill */}
          <motion.span
            variants={fadeUp}
            className="inline-block bg-blue-50 text-brand-primary text-sm font-semibold px-4 py-1.5 rounded-brand-pill border border-blue-100 mb-8"
          >
            Lanzamiento en Casablanca · Terminal 2
          </motion.span>

          {/* Giant headline — word by word */}
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-brand-dark mb-6 flex flex-wrap justify-center gap-x-4 md:gap-x-6">
            {HERO_WORDS.map((word) => (
              <motion.span key={word} variants={fadeUp} className="inline-block">
                {word}
              </motion.span>
            ))}
          </h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeUp}
            className="text-lg md:text-xl text-brand-muted max-w-2xl mx-auto mb-10"
          >
            Tu vehículo premium te espera encendido en el Aeropuerto Mohammed V.
            Reserva en 2 minutos, paga 10€ hoy.
          </motion.p>

          {/* Magnetic CTA */}
          <motion.button
            variants={fadeUp}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              document
                .getElementById("fleet")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
            className="bg-brand-primary text-white text-lg font-semibold px-8 py-4 rounded-brand-pill shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)] hover:shadow-[0_0_60px_-15px_rgba(37,99,235,0.7)] transition-shadow flex items-center gap-3 mx-auto min-h-[48px]"
          >
            <Zap className="w-5 h-5" />
            Reservar ahora
          </motion.button>
        </motion.div>
      </section>

      {/* ─── SECTION 2 · Bento Box — Trust Signals ───────── */}
      <section className="max-w-7xl mx-auto w-full px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Card 1 — Destacada (span 2 cols on md) */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="bg-brand-dark text-white rounded-3xl p-8 flex flex-col gap-4 md:col-span-2"
          >
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Solo 10€ para asegurar tu viaje.</h3>
            <p className="text-slate-300 text-sm leading-relaxed max-w-lg">
              Sin cargos ocultos. Congelamos tu coche con una mini-fianza, el
              resto lo pagas cómodamente al llegar.
            </p>
          </motion.div>

          {/* Card 2 — Conectividad */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="bg-emerald-50 text-brand-dark rounded-3xl p-8 flex flex-col gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-brand-success/10 flex items-center justify-center">
              <Wifi className="w-6 h-6 text-brand-success" />
            </div>
            <h3 className="text-xl font-bold">Conectado desde el minuto 1</h3>
            <p className="text-brand-muted text-sm leading-relaxed">
              Incluimos SIM de 5GB y Tag Jawaz para peajes.
            </p>
          </motion.div>

          {/* Card 3 — Digital check-in */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="bg-white border border-slate-200 text-brand-dark rounded-3xl p-8 flex flex-col gap-4 md:col-span-3 lg:col-span-1"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <Key className="w-6 h-6 text-brand-primary" />
            </div>
            <h3 className="text-xl font-bold">Check-in 100% Digital</h3>
            <p className="text-brand-muted text-sm leading-relaxed">
              Sube tu pasaporte hoy, recoge tus llaves al instante al aterrizar.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── SECTION 3 · Escaparate — Fleet Grid ─────────── */}
      <section id="fleet" className="max-w-7xl mx-auto w-full px-6 pb-24">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="text-3xl font-bold mb-10 text-center text-brand-dark"
        >
          Nuestra Flota Premium
        </motion.h2>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {VEHICLES.map((v) => (
            <motion.div key={v.model} variants={fadeUp}>
              <TrustCard
                model={v.model}
                totalPrice={v.totalPrice}
                imageUrl={v.imageUrl}
              />
            </motion.div>
          ))}
        </motion.div>
      </section>
    </main>
  );
}
