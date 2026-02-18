"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
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

/* ─── Data ──────────────────────────────────────────────────────────── */

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

const MARQUEE_ITEMS = [
  "Mohammed V Airport",
  "Casablanca",
  "24/7 Support",
  "Premium Fleet",
  "10€ Deposit",
  "Zero Queue",
  "Digital Check-In",
  "Instant Booking",
  "All-Risk Insurance",
  "5G SIM Included",
];

const STATS: { to: number; prefix?: string; suffix: string; label: string }[] = [
  { to: 847, suffix: "+", label: "Clientes satisfechos" },
  { to: 4.9, suffix: "★", label: "Valoración media" },
  { to: 3, prefix: "<", suffix: " min", label: "Check-in digital" },
];

/* ─── ReactBits: Noise Overlay ──────────────────────────────────────── */

function NoiseOverlay({ uid, opacity = 0.06 }: { uid: string; opacity?: number }) {
  return (
    <svg
      aria-hidden
      className="absolute inset-0 w-full h-full pointer-events-none mix-blend-overlay"
      style={{ opacity }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <filter id={uid}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.65"
          numOctaves="3"
          stitchTiles="stitch"
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${uid})`} />
    </svg>
  );
}

/* ─── ReactBits: Aurora Orbs ────────────────────────────────────────── */

function AuroraOrb({
  color,
  size,
  x,
  y,
  delay = 0,
}: {
  color: string;
  size: number;
  x: string;
  y: string;
  delay?: number;
}) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        width: size,
        height: size,
        left: x,
        top: y,
        transform: "translate(-50%, -50%)",
        filter: "blur(80px)",
      }}
      animate={{
        x: [0, 28, -18, 0],
        y: [0, -22, 26, 0],
        scale: [1, 1.12, 0.94, 1],
      }}
      transition={{
        duration: 14,
        delay,
        repeat: Infinity,
        ease: "easeInOut" as const,
      }}
    />
  );
}

/* ─── ReactBits: Decrypted Text ─────────────────────────────────────── */

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·!@#$%";

function DecryptedText({
  text,
  className,
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState<string>(() =>
    text
      .split("")
      .map((c) => (c === " " ? " " : "·"))
      .join("")
  );

  useEffect(() => {
    if (!inView) return;

    const timeout = setTimeout(() => {
      let iter = 0;
      const totalSteps = text.length * 3;

      const interval = setInterval(() => {
        setDisplay(
          text
            .split("")
            .map((char, i) => {
              if (char === " ") return " ";
              if (i < iter / 3) return char;
              return SCRAMBLE_CHARS[
                Math.floor(Math.random() * SCRAMBLE_CHARS.length)
              ];
            })
            .join("")
        );

        iter++;
        if (iter > totalSteps) {
          clearInterval(interval);
          setDisplay(text);
        }
      }, 28);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timeout);
  }, [inView, text, delay]);

  return (
    <span ref={ref} className={className} aria-label={text}>
      {display}
    </span>
  );
}

/* ─── ReactBits: Magnetic Button ────────────────────────────────────── */

function MagneticButton({
  children,
  onClick,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springCfg = { stiffness: 200, damping: 18, mass: 0.5 };
  const springX = useSpring(x, springCfg);
  const springY = useSpring(y, springCfg);

  const handleMove = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      x.set((e.clientX - rect.left - rect.width / 2) * 0.35);
      y.set((e.clientY - rect.top - rect.height / 2) * 0.35);
    },
    [x, y]
  );

  const handleLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return (
    <motion.button
      ref={ref}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      className={className}
    >
      {children}
    </motion.button>
  );
}

/* ─── ReactBits: Infinite Marquee ───────────────────────────────────── */

function Marquee({ items }: { items: string[] }) {
  const doubled = [...items, ...items];
  return (
    <div className="overflow-hidden bg-brand-dark border-y border-white/[0.08] py-5 select-none">
      <motion.div
        className="flex gap-12 whitespace-nowrap w-max"
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: "linear" as const,
        }}
      >
        {doubled.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-12 text-white/50 text-xs uppercase tracking-[0.2em] font-medium"
          >
            {item}
            <span className="text-brand-primary text-base leading-none">·</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ─── ReactBits: Count Up ───────────────────────────────────────────── */

function CountUp({
  to,
  prefix = "",
  suffix = "",
  decimals = 0,
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1800;
    const startTime = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(parseFloat((eased * to).toFixed(decimals)));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [inView, to, decimals]);

  return (
    <span ref={ref}>
      {prefix}
      {count.toFixed(decimals)}
      {suffix}
    </span>
  );
}

/* ─── ReactBits: Spotlight Card ─────────────────────────────────────── */

function SpotlightCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [spot, setSpot] = useState({ x: 0, y: 0, visible: false });

  const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setSpot({ x: e.clientX - rect.left, y: e.clientY - rect.top, visible: true });
  }, []);

  const handleLeave = useCallback(() => {
    setSpot((s) => ({ ...s, visible: false }));
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`relative overflow-hidden ${className ?? ""}`}
    >
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-500"
        style={{
          opacity: spot.visible ? 1 : 0,
          background: `radial-gradient(300px circle at ${spot.x}px ${spot.y}px, rgba(37,99,235,0.14) 0%, transparent 70%)`,
        }}
      />
      {children}
    </div>
  );
}

/* ─── Home ───────────────────────────────────────────────────────────── */

export default function Home() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const heroScale   = useTransform(scrollYProgress, [0, 0.6], [1, 0.88]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroY       = useTransform(scrollYProgress, [0, 0.6], ["0%", "18%"]);
  const contentY    = useTransform(scrollYProgress, [0, 1], ["8%", "0%"]);

  return (
    <main
      ref={containerRef}
      className="relative w-full bg-brand-dark min-h-[220vh]"
    >
      {/* ── 1. STICKY CINEMATIC HERO ─────────────────────────────── */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col items-center justify-center">

        {/* Background image */}
        <motion.div
          style={{ scale: heroScale, opacity: heroOpacity, y: heroY }}
          className="absolute inset-0 z-0"
        >
          <div className="absolute inset-0 bg-black/55 z-10" />
          <img
            src="https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=2000&auto=format&fit=crop"
            className="w-full h-full object-cover object-center"
            alt="Nexus Premium Car"
          />
        </motion.div>

        {/* ReactBits: Aurora Orbs */}
        <div className="absolute inset-0 z-[2] overflow-hidden pointer-events-none">
          <AuroraOrb color="rgba(37,99,235,0.45)"   size={700} x="15%"  y="35%"  delay={0} />
          <AuroraOrb color="rgba(16,185,129,0.22)"  size={450} x="78%"  y="65%"  delay={4} />
          <AuroraOrb color="rgba(139,92,246,0.30)"  size={550} x="62%"  y="18%"  delay={8} />
        </div>

        {/* ReactBits: Film grain noise */}
        <NoiseOverlay uid="rxb-hero-noise" opacity={0.05} />

        {/* Hero content */}
        <div className="relative z-20 flex flex-col items-center text-center px-4 w-full max-w-5xl">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" as const }}
            className="px-5 py-2 rounded-brand-pill border border-white/20 bg-white/[0.08] backdrop-blur-md mb-10 text-white/60 text-[10px] tracking-[0.3em] uppercase font-medium"
          >
            Aeropuerto Mohammed V · Casablanca
          </motion.div>

          {/* ReactBits: DecryptedText — main title */}
          <h1
            className="font-black text-white tracking-tighter leading-none mb-5"
            style={{ fontSize: "clamp(4.5rem, 16vw, 11rem)" }}
          >
            <DecryptedText text="NEXUS" delay={300} />
          </h1>

          {/* Sub-title words animate in */}
          <div className="flex flex-wrap justify-center gap-x-4 text-xl md:text-3xl font-light text-white/75 mb-6 tracking-wide">
            {["Aterriza.", "Reserva.", "Arranca."].map((word, i) => (
              <motion.span
                key={word}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 1 + i * 0.2,
                  duration: 0.7,
                  ease: [0.22, 1, 0.36, 1] as const,
                }}
                className="inline-block"
              >
                {word}
              </motion.span>
            ))}
          </div>

          {/* Body */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8, duration: 1 }}
            className="text-sm md:text-base text-slate-400 max-w-sm mb-12 leading-relaxed"
          >
            El primer alquiler premium sin cola en Casablanca.
            <br />
            Solo{" "}
            <span className="text-white font-semibold">10€</span> aseguran tu
            vehículo hoy.
          </motion.p>

          {/* ReactBits: Magnetic CTA */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.1, duration: 0.7, ease: "easeOut" as const }}
          >
            <MagneticButton
              onClick={() =>
                document.getElementById("fleet")?.scrollIntoView({ behavior: "smooth" })
              }
              className="group relative flex items-center gap-3 bg-white text-brand-dark font-bold text-sm px-10 py-4 rounded-brand-pill shadow-2xl min-h-[48px] overflow-hidden hover:bg-brand-primary hover:text-white transition-colors duration-300"
            >
              <span className="relative z-10">Explorar la flota</span>
              <motion.span
                className="relative z-10 inline-flex"
                animate={{ x: [0, 5, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 1.6,
                  ease: "easeInOut" as const,
                }}
              >
                <ArrowRight className="w-4 h-4" />
              </motion.span>
            </MagneticButton>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
          className="absolute bottom-10 z-20 flex flex-col items-center gap-2 text-white/30"
        >
          <span className="text-[9px] uppercase tracking-[0.35em]">Scroll</span>
          <div className="w-px h-12 bg-white/20 overflow-hidden relative">
            <motion.div
              animate={{ y: ["-100%", "100%"] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" as const }}
              className="absolute top-0 w-full h-1/2 bg-white/60"
            />
          </div>
        </motion.div>
      </div>

      {/* ── 2. MARQUEE — dark strip, seamless with hero ──────────── */}
      <div className="relative z-30">
        <Marquee items={MARQUEE_ITEMS} />
      </div>

      {/* ── 3. CONTENT SLAB ──────────────────────────────────────── */}
      <motion.div
        style={{ y: contentY }}
        className="relative z-30 bg-brand-bg rounded-t-[3rem] shadow-[0_-24px_80px_rgba(0,0,0,0.4)] w-full pt-20 pb-32 px-6 md:px-12"
      >
        <div className="max-w-7xl mx-auto">

          {/* ReactBits: Stats CountUp row */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}
            className="grid grid-cols-3 gap-4 md:gap-10 mb-24 border-b border-slate-100 pb-20"
          >
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center text-center gap-2"
              >
                <span className="text-3xl md:text-6xl font-black text-brand-dark tabular-nums leading-none">
                  <CountUp
                    to={stat.to}
                    prefix={stat.prefix ?? ""}
                    suffix={stat.suffix}
                    decimals={stat.to % 1 !== 0 ? 1 : 0}
                  />
                </span>
                <span className="text-[10px] md:text-xs text-brand-muted uppercase tracking-widest">
                  {stat.label}
                </span>
              </div>
            ))}
          </motion.div>

          {/* Section heading */}
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}
            className="text-4xl md:text-6xl font-bold text-brand-dark tracking-tight mb-16 text-center"
          >
            La redefinición del alquiler.
          </motion.h2>

          {/* ReactBits: Asymmetric Bento — with Spotlight Cards */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-24">

            {/* Card 1 — dark, 8 cols */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] as const }}
              className="md:col-span-8"
            >
              <SpotlightCard className="bg-brand-dark border border-white/[0.08] rounded-3xl p-10 flex flex-col justify-end min-h-[420px] cursor-default h-full">
                <NoiseOverlay uid="rxb-bento-1" opacity={0.04} />
                <Zap className="w-12 h-12 text-brand-primary mb-6 relative z-10" />
                <h3 className="text-2xl md:text-3xl text-white font-bold mb-4 relative z-10">
                  Solo 10€ para asegurar.
                </h3>
                <p className="text-slate-400 text-base md:text-lg max-w-md relative z-10 leading-relaxed">
                  Bloqueamos el vehículo con una micro-transacción. El balance restante
                  lo pagas de forma transparente en el aeropuerto.
                </p>
              </SpotlightCard>
            </motion.div>

            {/* Card 2 — light, 4 cols */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.65, delay: 0.15, ease: [0.22, 1, 0.36, 1] as const }}
              className="md:col-span-4"
            >
              <SpotlightCard className="bg-brand-surface border border-slate-200/80 shadow-xl rounded-3xl p-10 flex flex-col min-h-[420px] cursor-default h-full">
                <ShieldCheck className="w-12 h-12 text-brand-success mb-6" />
                <h3 className="text-2xl text-brand-dark font-bold mb-4">
                  Check-in 100% Digital.
                </h3>
                <p className="text-brand-muted text-base leading-relaxed">
                  Verifica tu pasaporte desde casa. Cero burocracia en el mostrador
                  al aterrizar.
                </p>
              </SpotlightCard>
            </motion.div>
          </div>

          {/* Fleet section */}
          <motion.h2
            id="fleet"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}
            className="text-3xl font-bold mb-10 text-center text-brand-dark"
          >
            Nuestra Flota Premium
          </motion.h2>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
            }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {VEHICLES.map((v) => (
              <motion.div
                key={v.model}
                variants={{
                  hidden: { opacity: 0, y: 40 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                      duration: 0.7,
                      ease: [0.22, 1, 0.36, 1] as const,
                    },
                  },
                }}
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
      </motion.div>
    </main>
  );
}
