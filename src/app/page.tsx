"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ShieldCheck, Zap } from "lucide-react";
import TrustCard from "@/components/vehicles/TrustCard";

/*  Data  */

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

/*  BlurText  */

function BlurText({ text, className }: { text: string; className?: string }) {
  const words = text.split(" ");
  return (
    <h1 className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ filter: "blur(10px)", opacity: 0, y: 20 }}
          animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            delay: i * 0.1,
            ease: [0.22, 1, 0.36, 1] as const,
          }}
          className="inline-block mr-[0.25em]"
        >
          {word}
        </motion.span>
      ))}
    </h1>
  );
}

/*  Variants  */

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

/*  Home  */

export default function Home() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.85]);
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["20%", "0%"]);

  return (
    <main ref={containerRef} className="relative w-full bg-brand-dark min-h-[200vh]">

      {/* 1. STICKY CINEMATIC HERO */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col items-center justify-center">
        <motion.div
          style={{ scale: heroScale, opacity: heroOpacity, y: heroY }}
          className="absolute inset-0 z-0"
        >
          <div className="absolute inset-0 bg-black/50 z-10" />
          <img
            src="https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=2000&auto=format&fit=crop"
            className="w-full h-full object-cover object-center"
            alt="Premium car Nexus"
          />
        </motion.div>

        <div className="relative z-20 flex flex-col items-center text-center px-4 w-full max-w-5xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" as const }}
            className="px-4 py-1.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-md mb-8 text-white text-sm tracking-widest uppercase font-medium"
          >
            Nexus Casablanca
          </motion.div>

          <BlurText
            text="Tu coche premium. Sin filas. Sin friccion."
            className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[1.1] mb-6"
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="text-lg md:text-2xl text-slate-300 max-w-2xl font-light mb-10"
          >
            Aterriza y arranca. Asegura tu reserva con solo 10 euros hoy.
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.7, ease: "easeOut" as const }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() =>
              document.getElementById("fleet")?.scrollIntoView({ behavior: "smooth" })
            }
            className="flex items-center gap-3 bg-white text-brand-dark font-bold text-base px-8 py-4 rounded-brand-pill shadow-2xl min-h-[48px] transition-shadow hover:shadow-white/20"
          >
            Ver flota disponible
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-10 z-20 flex flex-col items-center gap-2 text-white/40"
        >
          <span className="text-xs uppercase tracking-widest">Descubre Nexus</span>
          <div className="w-px h-12 bg-white/20 overflow-hidden relative">
            <motion.div
              animate={{ y: ["-100%", "100%"] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" as const }}
              className="absolute top-0 w-full h-1/2 bg-white"
            />
          </div>
        </motion.div>
      </div>

      {/* 2. CONTENT SLAB  slides over hero */}
      <motion.div
        style={{ y: contentY }}
        className="relative z-30 bg-brand-bg rounded-t-[3rem] shadow-[0_-20px_60px_rgba(0,0,0,0.35)] w-full py-24 px-6 md:px-12"
      >
        <div className="max-w-7xl mx-auto">

          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="text-4xl md:text-6xl font-bold text-brand-dark tracking-tight mb-16 text-center"
          >
            La redefinicion del alquiler.
          </motion.h2>

          {/* Asymmetric Bento */}
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-24"
          >
            <motion.div
              variants={fadeUp}
              whileHover={{ scale: 0.985, transition: { duration: 0.3 } }}
              className="md:col-span-8 bg-brand-dark rounded-3xl p-10 flex flex-col justify-end min-h-[400px] relative overflow-hidden group cursor-default"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <Zap className="w-12 h-12 text-brand-primary mb-6 relative z-10" />
              <h3 className="text-3xl text-white font-bold mb-4 relative z-10">
                Solo 10 euros para asegurar.
              </h3>
              <p className="text-slate-400 text-lg max-w-md relative z-10">
                Bloqueamos el vehiculo para ti con una micro-transaccion. El balance
                restante lo pagas transparentemente en el aeropuerto.
              </p>
            </motion.div>

            <motion.div
              variants={fadeUp}
              whileHover={{ scale: 0.985, transition: { duration: 0.3 } }}
              className="md:col-span-4 bg-brand-surface border border-slate-200 shadow-xl rounded-3xl p-10 flex flex-col min-h-[400px] cursor-default"
            >
              <ShieldCheck className="w-12 h-12 text-brand-success mb-6" />
              <h3 className="text-2xl text-brand-dark font-bold mb-4">
                Check-in 100% Digital
              </h3>
              <p className="text-brand-muted text-lg">
                Verifica tu pasaporte desde casa. Cero burocracia en el mostrador al aterrizar.
              </p>
            </motion.div>
          </motion.div>

          {/* Fleet */}
          <motion.h2
            id="fleet"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="text-3xl font-bold mb-10 text-center text-brand-dark"
          >
            Nuestra Flota Premium
          </motion.h2>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
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
        </div>
      </motion.div>
    </main>
  );
}
