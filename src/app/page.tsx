"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  useInView,
} from "framer-motion";
import { ArrowRight, ShieldCheck, Zap } from "lucide-react";
import TrustCard from "@/components/vehicles/TrustCard";

/*  DATA */

const VEHICLES = [
  {
    model: "Audi A4",
    totalPrice: "800\u20ac",
    imageUrl: "https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?q=80&w=800&auto=format&fit=crop",
  },
  {
    model: "Mercedes Clase C",
    totalPrice: "950\u20ac",
    imageUrl: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=800&auto=format&fit=crop",
  },
  {
    model: "Range Rover Evoque",
    totalPrice: "1.200\u20ac",
    imageUrl: "https://images.unsplash.com/photo-1519245659620-e859806a8d3b?q=80&w=800&auto=format&fit=crop",
  },
];

const STATS = [
  { value: "10\u20ac", label: "Para asegurar tu reserva" },
  { value: "2min", label: "Tiempo de check-in" },
  { value: "5GB", label: "SIM incluida" },
  { value: "100%", label: "Digital. Sin papel." },
];

const HERO_LINES = ["Tu coche premium.", "Sin filas. Sin", "friccion."];

/*  SCROLL PROGRESS BAR */

function ScrollBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  return (
    <motion.div
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 h-[2px] bg-brand-primary z-[100] origin-left"
    />
  );
}

/*  MAGNETIC BUTTON */

function MagneticButton({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 15 });
  const springY = useSpring(y, { stiffness: 150, damping: 15 });

  function handleMouseMove(e: React.MouseEvent<HTMLButtonElement>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left - rect.width / 2) * 0.35);
    y.set((e.clientY - rect.top - rect.height / 2) * 0.35);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.button
      ref={ref}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={className}
    >
      {children}
    </motion.button>
  );
}

/*  STAT ITEM */

function StatItem({ value, label, delay }: { value: string; label: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as const }}
      className="flex flex-col items-center text-center"
    >
      <span className="text-5xl md:text-7xl font-black text-brand-dark tracking-tighter">
        {value}
      </span>
      <span className="text-brand-muted text-sm mt-2 font-medium">{label}</span>
    </motion.div>
  );
}

/*  PROGRESS DOT */

function ProgressDot({
  index,
  total,
  scrollYProgress,
}: {
  index: number;
  total: number;
  scrollYProgress: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
  const scaleX = useTransform(
    scrollYProgress,
    [index / total, (index + 1) / total],
    [1, 2.8]
  );
  return (
    <motion.div
      style={{ scaleX }}
      className="h-1 w-4 rounded-full bg-slate-400/60 origin-left"
    />
  );
}

/*  HORIZONTAL FLEET SCROLL */

function HorizontalFleet() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const rawX = useTransform(
    scrollYProgress,
    [0, 1],
    ["8vw", `-${(VEHICLES.length - 1) * 80 + 8}vw`]
  );
  const x = useSpring(rawX, { stiffness: 80, damping: 25 });

  return (
    <section
      ref={sectionRef}
      style={{ height: `${VEHICLES.length * 100}vh` }}
      className="relative bg-brand-bg"
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Section label */}
        <div className="absolute top-10 left-8 z-10">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-xs uppercase tracking-[0.35em] text-brand-muted mb-1"
          >
            Nuestra flota
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl md:text-6xl font-black text-brand-dark tracking-tighter"
          >
            Premium.
          </motion.h2>
        </div>

        {/* Horizontal track */}
        <div className="absolute inset-0 flex items-center">
          <motion.div
            style={{ x }}
            className="flex gap-6 will-change-transform"
          >
            {VEHICLES.map((v, i) => (
              <motion.div
                key={v.model}
                initial={{ opacity: 0, scale: 0.92 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as const }}
                className="w-[80vw] md:w-[480px] flex-shrink-0"
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

        {/* Progress dots */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2.5 z-10">
          {VEHICLES.map((v, i) => (
            <ProgressDot
              key={v.model}
              index={i}
              total={VEHICLES.length}
              scrollYProgress={scrollYProgress}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/*  HOME */

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroBgScale = useTransform(heroProgress, [0, 1], [1.05, 1]);
  const heroOpacity = useTransform(heroProgress, [0, 0.8], [1, 0]);
  const heroY = useTransform(heroProgress, [0, 1], ["0%", "15%"]);
  const slabY = useTransform(heroProgress, [0, 1], ["15%", "0%"]);

  return (
    <>
      <ScrollBar />

      <main className="relative w-full bg-[#0a0a0a]">

        {/*  1. HERO  */}
        <div ref={heroRef} className="relative min-h-[180vh]">
          <div className="sticky top-0 h-screen w-full overflow-hidden flex items-end justify-center pb-24">

            {/* Background car image  subtle de-zoom on scroll */}
            <motion.div
              style={{ scale: heroBgScale, y: heroY, opacity: heroOpacity }}
              className="absolute inset-0 z-0"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-black/80 z-10" />
              <img
                src="https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=2400&auto=format&fit=crop"
                className="w-full h-full object-cover object-center"
                alt="Nexus premium vehicle"
              />
            </motion.div>

            {/* Hero text  line-by-line clip reveal */}
            <div className="relative z-20 w-full max-w-6xl mx-auto px-6">
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mb-6 flex items-center gap-3"
              >
                <span className="w-8 h-px bg-white/50" />
                <span className="text-white/60 text-xs uppercase tracking-[0.3em] font-medium">
                  Nexus / Casablanca
                </span>
              </motion.div>

              <h1 className="text-[clamp(3rem,10vw,9rem)] font-black text-white tracking-tighter leading-[0.9] mb-10">
                {HERO_LINES.map((line, i) => (
                  <div key={i} className="overflow-hidden">
                    <motion.div
                      initial={{ y: "110%" }}
                      animate={{ y: "0%" }}
                      transition={{
                        duration: 0.9,
                        delay: 0.3 + i * 0.15,
                        ease: [0.22, 1, 0.36, 1] as const,
                      }}
                    >
                      {line}
                    </motion.div>
                  </div>
                ))}
              </h1>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <MagneticButton
                  onClick={() =>
                    document.getElementById("stats")?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="flex items-center gap-3 bg-white text-[#0a0a0a] font-bold text-base px-8 py-4 rounded-full shadow-2xl min-h-[52px] cursor-pointer"
                >
                  Reserva ahora
                  <ArrowRight className="w-4 h-4" />
                </MagneticButton>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2, duration: 0.8 }}
                  className="text-white/50 text-sm"
                >
                  Solo 10\u20ac para asegurar tu vehiculo
                </motion.span>
              </div>
            </div>

            {/* Scroll indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8 }}
              className="absolute bottom-10 right-10 z-20 flex flex-col items-center gap-2 text-white/30"
            >
              <div className="w-px h-16 bg-white/15 overflow-hidden relative">
                <motion.div
                  animate={{ y: ["-100%", "100%"] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: "linear" as const }}
                  className="absolute top-0 w-full h-1/3 bg-white/60"
                />
              </div>
            </motion.div>
          </div>
        </div>

        {/*  2. STATS STRIP  */}
        <motion.section
          id="stats"
          style={{ y: slabY }}
          className="relative z-30 bg-brand-bg rounded-t-[2.5rem] shadow-[0_-30px_80px_rgba(0,0,0,0.4)] py-24 px-6"
        >
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-6">
            {STATS.map((s, i) => (
              <StatItem key={s.value} value={s.value} label={s.label} delay={i * 0.1} />
            ))}
          </div>
        </motion.section>

        {/*  3. HORIZONTAL FLEET  */}
        <HorizontalFleet />

        {/*  4. DARK BENTO TRUST  */}
        <section className="bg-[#0a0a0a] py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">

              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] as const }}
                whileHover={{ scale: 0.988 }}
                className="md:col-span-8 rounded-3xl bg-[#111] border border-white/5 p-12 flex flex-col justify-end min-h-[420px] relative overflow-hidden group cursor-default"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <Zap className="w-10 h-10 text-brand-primary mb-8 relative z-10" />
                <h3 className="text-4xl text-white font-bold mb-4 relative z-10 tracking-tight">
                  Solo 10\u20ac para asegurar tu viaje.
                </h3>
                <p className="text-white/40 text-lg max-w-lg relative z-10 leading-relaxed">
                  Bloqueamos el vehiculo con una micro-transaccion. El resto lo pagas transparentemente al llegar.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] as const }}
                whileHover={{ scale: 0.988 }}
                className="md:col-span-4 rounded-3xl bg-[#111] border border-white/5 p-12 flex flex-col justify-end min-h-[420px] cursor-default"
              >
                <ShieldCheck className="w-10 h-10 text-brand-success mb-8" />
                <h3 className="text-2xl text-white font-bold mb-4 tracking-tight">
                  Check-in 100% Digital
                </h3>
                <p className="text-white/40 leading-relaxed">
                  Pasaporte desde el sofa. Cero burocracia al aterrizar.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/*  5. MAGNETIC CTA  */}
        <section className="bg-[#0a0a0a] pb-32 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] as const }}
              className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-6"
            >
              Listo para aterrizar?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-white/40 text-xl mb-12 font-light"
            >
              Tu proximo viaje empieza aqui.
            </motion.p>
            <MagneticButton
              onClick={() =>
                document.getElementById("stats")?.scrollIntoView({ behavior: "smooth" })
              }
              className="inline-flex items-center gap-4 bg-white text-[#0a0a0a] font-black text-xl px-12 py-6 rounded-full shadow-[0_0_60px_-10px_rgba(255,255,255,0.25)] cursor-pointer min-h-[64px]"
            >
              Reservar con 10\u20ac
              <ArrowRight className="w-5 h-5" />
            </MagneticButton>
          </div>
        </section>
      </main>
    </>
  );
}
