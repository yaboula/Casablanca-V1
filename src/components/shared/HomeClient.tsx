"use client";

import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import { ArrowRight, Car, Clock, LayoutDashboard, MapPin, Plane, QrCode, Shield, Smartphone, Star, User, Wifi, Zap } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import BookingPanel from "@/components/shared/BookingPanel";
import CountUp from "@/components/ui/CountUp";
import Marquee from "@/components/ui/Marquee";
import { useBookingStore, useCurrencyStore } from "@/stores/useBookingStore";
import { useLocaleStore, useTranslations } from "@/lib/i18n";



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

import { readUserCookie } from "@/hooks/useUser";
import type { NexusUser } from "@/hooks/useUser";

export default function HomeClient() {
  const [session, setSession] = useState<NexusUser | null>(null);
  const [categoryPrices, setCategoryPrices] = useState<Record<string, number>>({});
  const { currency, madRate } = useCurrencyStore();
  const tHome = useTranslations("home");
  const locale = useLocaleStore((s) => s.locale);

  // Font size for hero headline — FR has longer words so we cap it smaller at every breakpoint
  const heroFontClass = locale === "fr"
    ? "text-[3.5rem] md:text-[4.5rem] lg:text-[3.2rem] xl:text-[5rem] 2xl:text-[5rem]"
    : "text-[3.5rem] md:text-[4.5rem] lg:text-[4rem] xl:text-[6rem] 2xl:text-[6.5rem]";

  // ── Translated static arrays (locale-reactive) ───────────────
  const MARQUEE_ITEMS = [
    tHome.marquee0, tHome.marquee1, tHome.marquee2, tHome.marquee3,
    tHome.marquee4, tHome.marquee5, tHome.marquee6, tHome.marquee7,
  ];
  const STEPS = [
    { n: "1", label: tHome.trustStep1 },
    { n: "2", label: tHome.trustStep2 },
    { n: "3", label: tHome.trustStep3, accent: true },
  ];
  const METRICS: Array<{ to: number; suffix: string; label: string }> = [
    { to: 3,   suffix: " min", label: tHome.metricPickup },
    { to: 10,  suffix: "€",    label: tHome.metricDeposit },
    { to: 24,  suffix: "/7",   label: tHome.metricSupport },
    { to: 100, suffix: "%",    label: tHome.metricDigital },
  ];
  const PROCESS_STEPS = [
    { Icon: Smartphone, title: tHome.step1Title, description: tHome.step1Desc },
    { Icon: QrCode,     title: tHome.step2Title, description: tHome.step2Desc },
    { Icon: Car,        title: tHome.step3Title, description: tHome.step3Desc },
  ];
  const fi = tHome.fleetIncludes;
  const FLEET_CATEGORIES = [
    {
      name: tHome.fleetCat0, apiCategory: "COMPACT", example: "VW Polo o similar",
      fromPrice: 45,
      imageUrl: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?q=80&w=800&auto=format&fit=crop",
      badge: tHome.fleetCat0Badge, includes: [fi.basicInsurance, fi.unlimitedKm],
    },
    {
      name: tHome.fleetCat1, apiCategory: "SUV", example: "Hyundai Tucson o similar",
      fromPrice: 85,
      imageUrl: "https://images.unsplash.com/photo-1519245659620-e859806a8d3b?q=80&w=800&auto=format&fit=crop",
      badge: tHome.fleetCat1Badge, includes: [fi.fullInsurance, fi.jawazTag, fi.sim5g],
    },
    {
      name: tHome.fleetCat2, apiCategory: "LUXURY", example: "Audi A4 o similar",
      fromPrice: 120,
      imageUrl: "https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?q=80&w=800&auto=format&fit=crop",
      badge: null, includes: [fi.fullInsurance, fi.jawazTag, fi.sim5g],
    },
    {
      name: tHome.fleetCat3, apiCategory: "SEDAN", example: "Mercedes Clase C o similar",
      fromPrice: 140,
      imageUrl: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=800&auto=format&fit=crop",
      badge: null, includes: [fi.fullInsurance, fi.jawazTag, fi.sim5g, fi.premiumCleaning],
    },
  ];
  const TESTIMONIALS = [
    { name: "Carlos M.",  route: "CMN → Casablanca", rating: 5, text: tHome.testimonial0 },
    { name: "Sophie L.",  route: "CMN → Marrakech",  rating: 5, text: tHome.testimonial1 },
    { name: "Ahmed B.",   route: "CMN → Rabat",      rating: 5, text: tHome.testimonial2 },
    { name: "Laura G.",   route: "CMN → Essaouira",  rating: 5, text: tHome.testimonial3 },
    { name: "Youssef K.", route: "CMN → Fez",        rating: 5, text: tHome.testimonial4 },
    { name: "María T.",   route: "CMN → Agadir",     rating: 5, text: tHome.testimonial5 },
  ];

  useEffect(() => { setSession(readUserCookie()); }, []);

  // Fetch real min prices per category from API
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3900/api/v1";
    fetch(`${base}/vehicles`)
      .then((r) => r.json())
      .then((json) => {
        const vehicles: Array<{ category: string; pricePerDayEurCents: number }> =
          json.data ?? [];
        const prices: Record<string, number> = {};
        for (const v of vehicles) {
          const eur = v.pricePerDayEurCents / 100;
          if (!prices[v.category] || eur < prices[v.category]) prices[v.category] = eur;
        }
        setCategoryPrices(prices);
      })
      .catch(() => {});
  }, []);

  // Build catalog URL with date params from booking store (if dates are set)
  const { pickupDate, returnDate } = useBookingStore();
  const catalogUrl = (() => {
    const qs = new URLSearchParams();
    if (pickupDate) qs.set("pickupDate", new Date(pickupDate).toISOString());
    if (returnDate) qs.set("returnDate", new Date(returnDate).toISOString());
    const q = qs.toString();
    return q ? `/catalog?${q}` : "/catalog";
  })();

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
            className="absolute top-[22%] left-[2%] xl:left-[2.5%] hidden min-[1500px]:block z-10"
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
                <p className="text-brand-dark font-bold text-sm leading-none">{tHome.badge10eur}</p>
                <p className="text-brand-muted text-[10px] mt-0.5">{tHome.badge10eurSub}</p>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            className="absolute top-[18%] right-[2%] xl:right-[2.5%] hidden min-[1500px]:block z-10"
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
                <p className="text-brand-muted text-[10px] mt-0.5">{tHome.badgeRating}</p>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            className="absolute bottom-[28%] left-[2%] xl:left-[2.5%] hidden min-[1500px]:block z-10"
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
                <p className="text-brand-dark font-bold text-sm leading-none">{tHome.badge3min}</p>
                <p className="text-brand-muted text-[10px] mt-0.5">{tHome.badge3minSub}</p>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            className="absolute bottom-[30%] right-[2%] xl:right-[2.5%] hidden min-[1500px]:block z-10"
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
                <p className="text-brand-dark font-bold text-sm leading-none">{tHome.badge24h}</p>
                <p className="text-brand-muted text-[10px] mt-0.5">{tHome.badge24hSub}</p>
              </div>
            </motion.div>
          </motion.div>

          {/* ── Hero center + Booking Panel ───────── */}
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16 w-full max-w-7xl mx-auto flex-1 min-h-[80vh]">

            {/* Center content */}
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left w-full max-w-xl xl:max-w-2xl flex-1">

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
                {tHome.heroBadge}
              </motion.div>

              {/* Headline */}
              <div className="mb-3 w-full">
                <motion.div
                  variants={wordContainer}
                  initial="hidden"
                  animate="visible"
                  className={`flex flex-wrap justify-center lg:justify-start gap-x-[0.28em] ${heroFontClass}`}
                >
                  {[tHome.heroWord1, tHome.heroWord2].map((word, i) => (
                    <span key={i} className="overflow-hidden inline-block pb-1">
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
                  key={tHome.heroInstant}
                  variants={charContainer}
                  initial="hidden"
                  animate="visible"
                  className={`flex flex-wrap justify-center lg:justify-start ${heroFontClass}`}
                  style={{ perspective: "800px" }}
                  aria-label={tHome.heroInstant}
                >
                  {tHome.heroInstant.split("").map((char, i) => (
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
                {tHome.heroSubtitle}
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

              {/* ── Session CTA (logged-in users only) ───── */}
              {session && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.75, duration: 0.45, ease: [0.22, 1, 0.36, 1] as const }}
                  className="mt-6 w-full max-w-sm"
                >
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-brand-dark truncate">
                        {tHome.sessionGreeting.replace("{name}", session.fullName?.split(" ")[0] ?? session.email.split("@")[0])}
                      </p>
                      <p className="text-sm text-slate-500">
                        {session.role === "OPERATOR" || session.role === "ADMIN" ? tHome.sessionOperatorDesc : tHome.sessionCustomerDesc}
                      </p>
                    </div>
                    <Link
                      href={session.role === "OPERATOR" || session.role === "ADMIN" ? "/operator/dashboard" : "/dashboard"}
                      className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-xs font-bold
                                 px-3.5 py-2 rounded-xl hover:bg-blue-700 active:scale-[0.98]
                                 transition-all shrink-0 min-h-[36px]"
                    >
                      {session.role === "OPERATOR" || session.role === "ADMIN" ? (
                        <LayoutDashboard className="w-3.5 h-3.5" />
                      ) : (
                        <QrCode className="w-3.5 h-3.5" />
                      )}
                      {session.role === "OPERATOR" || session.role === "ADMIN" ? tHome.sessionCTAOperator : tHome.sessionCTACustomer}
                    </Link>
                  </div>
                </motion.div>
              )}
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
              {METRICS.map((m, i) => (
                <motion.div
                  key={i}
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
                {tHome.howItWorksEyebrow}
              </p>
              <h2 className="text-4xl md:text-5xl font-bold text-brand-dark tracking-tight">
                {tHome.howItWorksTitle}
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
                  key={i}
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
                    {tHome.stepLabel} {i + 1}
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
              className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-14"
            >
              <div>
                <p className="text-xs text-brand-muted uppercase tracking-[0.2em] font-semibold mb-3">
                  {tHome.fleetEyebrow}
                </p>
                <h2 className="text-4xl md:text-5xl font-bold text-brand-dark tracking-tight">
                  {tHome.fleetTitle}
                </h2>
              </div>
              <a
                href={catalogUrl}
                className="inline-flex items-center gap-2 text-brand-primary text-sm font-semibold hover:gap-3 transition-all duration-200"
              >
                {tHome.fleetViewAll} <ArrowRight className="w-4 h-4" />
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
                  key={cat.apiCategory}
                  href={catalogUrl}
                  variants={fadeUp}
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] as const }}
                  className="group relative rounded-2xl overflow-hidden border border-slate-100 bg-white hover:shadow-xl hover:shadow-blue-100/50 hover:border-blue-200 transition-all duration-300 cursor-pointer block"
                >
                  {cat.badge && (
                    <span className="absolute top-3 left-3 z-10 text-[10px] font-bold uppercase tracking-wider bg-brand-primary text-white px-2.5 py-1 rounded-full shadow-sm">
                      {cat.badge}
                    </span>
                  )}
                  <div className="relative overflow-hidden h-48 bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cat.imageUrl}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white/30 to-transparent" />
                  </div>
                  <div className="p-5">
                    <p className="text-[10px] text-brand-muted font-medium uppercase tracking-widest mb-1">
                      {cat.example}
                    </p>
                    <h3 className="text-xl font-bold text-brand-dark mb-2">{cat.name}</h3>

                    {/* Includes strip */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {cat.includes.map((inc) => (
                        <span
                          key={inc}
                          className="text-[10px] font-medium text-brand-primary bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full"
                        >
                          {inc}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div>
                        <span className="text-xs text-brand-muted">{tHome.fleetFrom} </span>
                        <span className="text-2xl font-black text-brand-primary">
                          {currency === "MAD"
                            ? Math.round((categoryPrices[cat.apiCategory] ?? cat.fromPrice) * madRate)
                            : (categoryPrices[cat.apiCategory] ?? cat.fromPrice)}
                        </span>
                        <span className="text-xs text-brand-muted">{currency === "MAD" ? " DH" : "€"}{tHome.fleetPerDay}</span>
                      </div>
                      <span className="w-9 h-9 rounded-full bg-brand-primary/10 flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white text-brand-primary transition-colors duration-200">
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </motion.a>
              ))}
            </motion.div>

            {/* Includes banner */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mt-8 flex flex-wrap items-center justify-center gap-6 text-brand-muted text-xs font-medium"
            >
              <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-brand-primary" /> {tHome.incInsurance}</span>
              <span className="flex items-center gap-1.5"><Wifi className="w-3.5 h-3.5 text-brand-primary" /> {tHome.incSIM}</span>
              <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-brand-primary" /> {tHome.incJawaz}</span>
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-brand-primary" /> {tHome.incPickup}</span>
            </motion.div>
          </div>
        </section>

        {/* ==========================================================
            6. TESTIMONIALS — Auto-scroll
        ========================================================== */}
        <TestimonialsCarousel
          eyebrow={tHome.testimonialsEyebrow}
          title={tHome.testimonialsTitle}
          testimonials={TESTIMONIALS}
        />

      </div>
    </>
  );
}

/* ── Testimonials carousel component ──────────────────────────── */
interface TestimonialsCarouselProps {
  eyebrow: string;
  title: string;
  testimonials: Array<{ name: string; route: string; rating: number; text: string }>;
}

function TestimonialsCarousel({ eyebrow, title, testimonials }: TestimonialsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let raf: number;
    let scrollPos = 0;
    const speed = 0.5; // px per frame

    const tick = () => {
      scrollPos += speed;
      // When we've scrolled past the first set, reset seamlessly
      if (scrollPos >= el.scrollWidth / 2) {
        scrollPos = 0;
      }
      el.scrollLeft = scrollPos;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // Pause on hover
    const pause = () => cancelAnimationFrame(raf);
    const resume = () => { raf = requestAnimationFrame(tick); };
    el.addEventListener("mouseenter", pause);
    el.addEventListener("mouseleave", resume);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("mouseenter", pause);
      el.removeEventListener("mouseleave", resume);
    };
  }, []);

  // Double testimonials for seamless loop
  const doubled = [...testimonials, ...testimonials];

  return (
    <section className="bg-slate-50 border-y border-slate-100 py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] as const }}
          className="text-center mb-12"
        >
          <p className="text-xs text-brand-muted uppercase tracking-[0.2em] font-semibold mb-3">
            {eyebrow}
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-brand-dark tracking-tight">
            {title}
          </h2>
        </motion.div>
      </div>

      {/* Full-width scroller */}
      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-hidden px-6 cursor-default"
        style={{ scrollbarWidth: "none" }}
      >
        {doubled.map((t, idx) => (
          <div
            key={`${t.name}-${idx}`}
            className="flex-shrink-0 w-[340px] rounded-2xl border border-slate-100 bg-white p-7 flex flex-col"
          >
            <div className="flex gap-0.5 mb-4">
              {[...Array(t.rating)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-brand-dark text-[15px] leading-relaxed font-medium flex-1 mb-5">
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
          </div>
        ))}
      </div>
    </section>
  );
}
