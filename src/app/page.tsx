"use client";

import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { ArrowRight, Clock, ShieldCheck, Star, Zap } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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

const STEPS = [
  { n: "1", label: "Aterriza" },
  { n: "2", label: "Escanea QR" },
  { n: "3", label: "Conduce", accent: true },
];

/* -- Char reveal (smooth clip stagger) ------------------------------------- */

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

/* -- Word clip stagger ----------------------------------------------------- */
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

/* -- Section fade-up ------------------------------------------------------- */
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

/* ==========================================================================
   CAR SILHOUETTE — premium sedan side profile facing right
   ========================================================================== */
function CarSilhouette() {
  const spokeAngles = [0, 60, 120, 180, 240, 300];
  return (
    <svg width="440" height="130" viewBox="0 0 440 130" fill="none" aria-hidden>
      {/* Body lower */}
      <path
        d="M26 98 Q40 104 64 104 L376 104 Q398 104 410 94 L420 80 Q396 74 374 52 Q336 16 272 12 L168 12 Q104 16 66 52 Q44 74 26 80 Z"
        fill="url(#bodyGrad)"
      />
      {/* Roof */}
      <path
        d="M168 12 L272 12 Q336 16 364 50 Q328 45 266 43 L174 43 Q112 45 76 50 Q104 16 168 12 Z"
        fill="#162232"
      />
      {/* Windshield tint */}
      <path
        d="M179 43 L261 43 Q298 44 322 52 Q288 48 260 47 L180 47 Q152 48 118 52 Q142 44 179 43 Z"
        fill="#93C5FD"
        opacity="0.18"
      />
      {/* Rear window */}
      <rect x="136" y="48" width="61" height="26" rx="4" fill="#7DD3FC" opacity="0.13" />
      {/* Mid window */}
      <rect x="203" y="48" width="53" height="26" rx="4" fill="#7DD3FC" opacity="0.10" />
      {/* Front window */}
      <rect x="262" y="48" width="44" height="25" rx="4" fill="#93C5FD" opacity="0.09" />
      {/* Door lines */}
      <line x1="199" y1="48" x2="199" y2="98" stroke="#1E3448" strokeWidth="1.5" />
      <line x1="258" y1="48" x2="258" y2="98" stroke="#1E3448" strokeWidth="1.5" />
      {/* Door handles */}
      <rect x="218" y="74" width="18" height="4" rx="2" fill="#253D55" />
      <rect x="278" y="74" width="18" height="4" rx="2" fill="#253D55" />
      {/* Sill */}
      <rect x="48" y="97" width="344" height="7" rx="3" fill="#0A1620" />
      {/* Rear wheel */}
      <circle cx="110" cy="104" r="27" fill="#060E18" />
      <circle cx="110" cy="104" r="17" fill="#0C1B28" />
      <circle cx="110" cy="104" r="9" fill="#162232" />
      <circle cx="110" cy="104" r="3.5" fill="#2563EB" opacity="0.85" />
      {spokeAngles.map((deg) => (
        <line
          key={`rs-${deg}`}
          x1={110 + 9 * Math.cos((deg * Math.PI) / 180)}
          y1={104 + 9 * Math.sin((deg * Math.PI) / 180)}
          x2={110 + 16 * Math.cos((deg * Math.PI) / 180)}
          y2={104 + 16 * Math.sin((deg * Math.PI) / 180)}
          stroke="#1E3448"
          strokeWidth="2"
        />
      ))}
      {/* Front wheel */}
      <circle cx="330" cy="104" r="27" fill="#060E18" />
      <circle cx="330" cy="104" r="17" fill="#0C1B28" />
      <circle cx="330" cy="104" r="9" fill="#162232" />
      <circle cx="330" cy="104" r="3.5" fill="#2563EB" opacity="0.85" />
      {spokeAngles.map((deg) => (
        <line
          key={`fs-${deg}`}
          x1={330 + 9 * Math.cos((deg * Math.PI) / 180)}
          y1={104 + 9 * Math.sin((deg * Math.PI) / 180)}
          x2={330 + 16 * Math.cos((deg * Math.PI) / 180)}
          y2={104 + 16 * Math.sin((deg * Math.PI) / 180)}
          stroke="#1E3448"
          strokeWidth="2"
        />
      ))}
      {/* Ground shadow */}
      <ellipse cx="220" cy="126" rx="180" ry="6" fill="#000" opacity="0.5" />
      {/* Roof specular */}
      <path d="M185 20 Q220 13 255 20" stroke="#3B82F6" strokeWidth="1.2" opacity="0.22" strokeLinecap="round" fill="none" />
      {/* Headlight */}
      <path d="M406 78 Q414 74 420 78 Q414 84 406 84 Z" fill="#DBEAFE" opacity="0.9" />
      <ellipse cx="416" cy="80" rx="4" ry="3" fill="#FFFFFF" opacity="0.8" />
      {/* Headlight beam */}
      <path d="M414 74 L440 62 L440 98 L414 86 Z" fill="url(#beamGrad)" opacity="0.10" />
      {/* Tail light bar */}
      <rect x="24" y="78" width="14" height="8" rx="3" fill="#EF4444" opacity="0.9" />
      <rect x="24" y="78" width="6" height="8" rx="3" fill="#FCA5A5" opacity="0.5" />
      <defs>
        <linearGradient id="bodyGrad" x1="0" y1="40" x2="0" y2="104" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E3448" />
          <stop offset="100%" stopColor="#0A1824" />
        </linearGradient>
        <linearGradient id="beamGrad" x1="414" y1="80" x2="440" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#93C5FD" />
          <stop offset="100%" stopColor="#93C5FD" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ==========================================================================
   INTRO SPLASH — premium cinematic vehicle entrance · NEXUS
   ========================================================================== */
function IntroSplash({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  /* Letter stagger for "NEXUS" */
  const letterContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
  };
  const letterItem = {
    hidden: { y: "110%", opacity: 0 },
    visible: {
      y: "0%",
      opacity: 1,
      transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
    },
  };

  const roadDashes = [0, 1, 2, 3, 4, 5];
  const speedLines = [
    { top: "55%", delay: 0.70, w: "45%", op: 0.22 },
    { top: "59%", delay: 0.63, w: "68%", op: 0.32 },
    { top: "61%", delay: 0.67, w: "74%", op: 0.26 },
    { top: "63%", delay: 0.65, w: "52%", op: 0.18 },
  ];

  return (
    <motion.div
      className="fixed inset-0 z-[200] overflow-hidden bg-[#060C18]"
      style={{ transformOrigin: "top" }}
      initial={{ scaleY: 1 }}
      exit={{
        scaleY: 0,
        transition: { duration: 0.72, ease: [0.76, 0, 0.24, 1] as const },
      }}
    >
      {/* ── BACKGROUND — exact mirror of hero page ── */}
      {/* Dot grid */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(51,65,85,0.65) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          opacity: 0.38,
        }}
      />
      {/* Blue radial top-right */}
      <div
        aria-hidden
        className="absolute top-0 right-0 w-[800px] h-[800px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at top right, rgba(37,99,235,0.24) 0%, transparent 65%)",
        }}
      />
      {/* Emerald radial bottom-left */}
      <div
        aria-hidden
        className="absolute bottom-0 left-0 w-[650px] h-[650px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at bottom left, rgba(16,185,129,0.13) 0%, transparent 65%)",
        }}
      />
      {/* Bottom veil — fades toward the light hero bg for seamless exit */}
      <motion.div
        aria-hidden
        className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.0, delay: 2.0 }}
        style={{ background: "linear-gradient(to top, rgba(248,250,252,0.05) 0%, transparent 100%)" }}
      />

      {/* ── NEXUS LOGOTYPE — upper center ── */}
      <div className="absolute inset-x-0 top-[18%] flex flex-col items-center gap-3 z-10" aria-label="NEXUS">
        {/* Letter-by-letter clip reveal */}
        <motion.div
          variants={letterContainer}
          initial="hidden"
          animate="visible"
          className="flex items-end select-none"
        >
          {"NEXUS".split("").map((char, i) => (
            <span key={i} className="overflow-hidden inline-block">
              <motion.span
                variants={letterItem}
                className="inline-block font-black text-white leading-none"
                style={{ fontSize: "clamp(3.5rem,10vw,6.5rem)", letterSpacing: "0.14em" }}
              >
                {char}
              </motion.span>
            </span>
          ))}
          {/* Brand dot */}
          <span className="overflow-hidden inline-block ml-0.5">
            <motion.span
              variants={letterItem}
              className="inline-block font-black text-brand-primary leading-none"
              style={{ fontSize: "clamp(3.5rem,10vw,6.5rem)", letterSpacing: "0.14em" }}
            >
              .
            </motion.span>
          </span>
        </motion.div>

        {/* Separator — draws from center outward */}
        <motion.div
          className="rounded-full"
          style={{
            height: "1px",
            width: "240px",
            background: "linear-gradient(to right, transparent, rgba(37,99,235,0.75), transparent)",
          }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] as const, delay: 0.56 }}
        />

        {/* Tagline */}
        <div className="overflow-hidden">
          <motion.p
            className="text-[0.65rem] font-semibold text-slate-500 tracking-[0.3em] uppercase"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const, delay: 0.64 }}
          >
            Airport Mobility &middot; CMN
          </motion.p>
        </div>
      </div>

      {/* ── ROAD SCENE — occupies lower 40% ── */}
      <div
        aria-hidden
        className="absolute inset-x-0 pointer-events-none"
        style={{ top: "60%", bottom: 0 }}
      >
        {/* Horizon line */}
        <div
          className="absolute left-0 right-0 h-[1px]"
          style={{
            background:
              "linear-gradient(to right, transparent, rgba(51,65,85,0.75) 15%, rgba(51,65,85,0.75) 85%, transparent)",
          }}
        />
        {/* Road surface gradient */}
        <div
          className="absolute left-0 right-0 bottom-0"
          style={{
            top: "1px",
            background: "linear-gradient(to bottom, rgba(15,23,42,0.6) 0%, rgba(6,12,24,0.9) 100%)",
          }}
        />
        {/* Moving center dashes */}
        {roadDashes.map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-slate-600"
            style={{ top: "36%", height: "2px", width: "38px", left: `${6 + i * 16}%` }}
            animate={{ x: ["0%", "-960%"], opacity: [0, 0.55, 0.55, 0] }}
            transition={{
              duration: 1.5,
              delay: 0.38 + i * 0.06,
              repeat: Infinity,
              ease: "linear" as const,
            }}
          />
        ))}
      </div>

      {/* ── SPEED LINES ── */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        {speedLines.map((l, i) => (
          <motion.div
            key={i}
            className="absolute h-[1px] left-0"
            style={{
              top: l.top,
              width: l.w,
              background:
                "linear-gradient(to right, transparent, rgba(37,99,235,0.85), transparent)",
            }}
            animate={{ opacity: [0, l.op, l.op, 0], scaleX: [0.15, 1, 1, 0.65] }}
            transition={{
              duration: 1.7,
              delay: l.delay,
              ease: "easeInOut" as const,
              times: [0, 0.15, 0.72, 1],
            }}
          />
        ))}
      </div>

      {/* ── CAR SWEEP ── */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{ top: "42%", left: 0, right: 0, perspective: "1400px" }}
      >
        <motion.div
          style={{ willChange: "transform, filter" }}
          initial={{ x: -560, scale: 0.2, rotateY: -18 }}
          animate={{
            x: [-560, -180, 55, 1200],
            scale: [0.2, 0.82, 2.15, 0.4],
            rotateY: [-18, -8, 0, 11],
            filter: [
              "blur(0px) brightness(1.0)",
              "blur(2px) brightness(1.1)",
              "blur(13px) brightness(1.45)",
              "blur(7px) brightness(0.75)",
            ],
          }}
          transition={{
            duration: 1.85,
            delay: 0.4,
            ease: [0.11, 0, 0.5, 0] as const,
            times: [0, 0.3, 0.6, 1],
          }}
        >
          <CarSilhouette />
        </motion.div>
      </div>

      {/* ── LOADING BAR ── */}
      <div className="absolute bottom-[11%] left-0 right-0 flex flex-col items-center gap-2 z-10">
        <motion.div
          className="relative w-52 h-[2px] rounded-full overflow-hidden"
          style={{ background: "rgba(30,52,72,0.9)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.28 }}
        >
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              background: "linear-gradient(to right, rgba(37,99,235,0.5), #2563EB)",
              boxShadow: "0 0 10px rgba(37,99,235,0.9)",
            }}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2.4, ease: [0.22, 1, 0.36, 1] as const, delay: 0.35 }}
          />
        </motion.div>
        <motion.p
          className="text-[0.58rem] font-medium tracking-[0.32em] uppercase text-slate-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
        >
          Iniciando&hellip;
        </motion.p>
      </div>

      {/* Corner badge */}
      <motion.p
        className="absolute bottom-5 right-5 text-[0.52rem] font-mono tracking-widest uppercase text-slate-700"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
      >
        CMN &middot; 2026
      </motion.p>
    </motion.div>
  );
}

/* ========================================================================== */

export default function Home() {
  const [introVisible, setIntroVisible] = useState(true);

  /* -- Mouse spotlight (Framer springs — GPU only) -- */
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
      {/* ── Intro splash ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {introVisible && (
          <IntroSplash key="intro" onDone={() => setIntroVisible(false)} />
        )}
      </AnimatePresence>

      <div className="relative w-full bg-brand-bg">

        {/* ================================================================
            1. HERO — Premium airport-first experience
        ================================================================ */}
        <section
          className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 py-20"
          onMouseMove={handleMouseMove}
        >
          {/* ── Mouse-reactive spotlight ──────────────────────────────── */}
          <motion.div
            aria-hidden
            className="absolute inset-0 pointer-events-none z-[2]"
            style={{ background: spotlightBg }}
          />

          {/* ── Dot grid ──────────────────────────────────────────────── */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none z-[1]"
            style={{
              backgroundImage:
                "radial-gradient(circle, #CBD5E1 1px, transparent 1px)",
              backgroundSize: "28px 28px",
              opacity: 0.55,
            }}
          />

          {/* ── Color radials ─────────────────────────────────────────── */}
          <div
            aria-hidden
            className="absolute top-0 right-0 w-[700px] h-[700px] pointer-events-none z-[1]"
            style={{
              background:
                "radial-gradient(ellipse at top right, rgba(37,99,235,0.10) 0%, transparent 62%)",
            }}
          />
          <div
            aria-hidden
            className="absolute bottom-0 left-0 w-[500px] h-[500px] pointer-events-none z-[1]"
            style={{
              background:
                "radial-gradient(ellipse at bottom left, rgba(16,185,129,0.07) 0%, transparent 60%)",
            }}
          />

          {/* ── Floating badges (desktop) ──────────────────────────────── */}

          <motion.div
            className="absolute top-[22%] left-[6%] xl:left-[12%] hidden lg:block z-10"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}
          >
            <motion.div
              animate={{ y: [0, -9, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" as const, delay: 0.3 }}
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

          <motion.div
            className="absolute top-[18%] right-[6%] xl:right-[12%] hidden lg:block z-10"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2.4, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}
          >
            <motion.div
              animate={{ y: [0, -7, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" as const, delay: 1 }}
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

          <motion.div
            className="absolute bottom-[28%] left-[5%] xl:left-[10%] hidden lg:block z-10"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2.6, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" as const, delay: 0.8 }}
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

          <motion.div
            className="absolute bottom-[30%] right-[5%] xl:right-[10%] hidden lg:block z-10"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2.8, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" as const, delay: 1.5 }}
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

          {/* ── Center content ─────────────────────────────────────────── */}
          <div className="relative z-10 flex flex-col items-center text-center w-full max-w-3xl">

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

            {/* ── Headline line 1 — word clip stagger ─────────────────── */}
            <div className="mb-3 w-full">
              <motion.div
                variants={wordContainer}
                initial="hidden"
                animate="visible"
                className="flex flex-wrap justify-center gap-x-[0.28em]"
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

              {/* ── Headline line 2 — char clip stagger (smooth) ─────── */}
              <motion.div
                variants={charContainer}
                initial="hidden"
                animate="visible"
                className="flex flex-wrap justify-center"
                style={{
                  fontSize: "clamp(3.5rem, 11vw, 6.5rem)",
                  perspective: "800px",
                }}
                aria-label="Al instante."
              >
                {"Al instante.".split("").map((char, i) => (
                  <span
                    key={i}
                    className="overflow-hidden inline-block"
                    style={{ paddingBottom: "0.05em" }}
                  >
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

            {/* ── 3-step process strip ─────────────────────────────────── */}
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

            {/* ── Subtitle ─────────────────────────────────────────────── */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.65, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
              className="text-base md:text-lg text-brand-muted max-w-sm mb-10 leading-relaxed"
            >
              Sin filas. Sin papel. Solo tú y la carretera.
            </motion.p>

            {/* ── CTA group ────────────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.75, duration: 0.55, ease: [0.22, 1, 0.36, 1] as const }}
              className="flex flex-col sm:flex-row items-center gap-4 mb-10"
            >
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

            {/* ── Star rating row ──────────────────────────────────────── */}
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
                {" "}· Valorado por 500 clientes en CMN
              </span>
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
              {/* Card grande — dark */}
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
    </>
  );
}
