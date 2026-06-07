"use client";

import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Plane, Timer } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import BookingPanel from "@/components/shared/BookingPanel";
import { useTranslations } from "@/lib/i18n";

const EASE = [0.16, 1, 0.3, 1] as const;

/* Animated headline line */
function Line({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.9, ease: EASE }}
      className="block"
    >
      {children}
    </motion.span>
  );
}

export default function HeroSection() {
  const tHome = useTranslations("home");

  return (
    <section id="top" className="relative w-full bg-white overflow-hidden">
      <div className="nx-container pt-24 md:pt-28 pb-10 md:pb-12">
        {/* TOP — copy + cinematic vehicle */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-8 lg:gap-10 items-center lg:min-h-[clamp(360px,44vh,520px)]">
          {/* LEFT — copy */}
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="flex items-center gap-3"
            >
              <span className="inline-block w-10 h-px bg-neutral-900" />
              <span className="nx-eyebrow font-medium text-neutral-700">
                Casablanca · Mohammed V Intl. — CMN
              </span>
            </motion.div>

            <h1 className="nx-display font-display mt-6 md:mt-7 font-light text-neutral-900">
              <Line delay={0.05}>{tHome.heroWord1}</Line>
              <Line delay={0.15}>
                {tHome.heroWord2}{" "}
                <span className="italic text-[var(--color-nx-accent)] font-light">
                  {tHome.heroInstant}
                </span>
              </Line>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.9 }}
              className="text-lg max-w-[34rem] text-neutral-600 mt-7 md:mt-8 leading-relaxed"
            >
              {tHome.heroSubtitle}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.9 }}
              className="flex flex-wrap items-center gap-x-6 gap-y-4 mt-8"
            >
              <Link
                href="/catalog"
                className="group inline-flex items-center gap-2.5 bg-[#0A0A0A] text-white hover:bg-[var(--color-nx-accent)] rounded-full pl-8 pr-7 py-[1.05rem] text-[1.0625rem] font-medium transition-colors duration-300"
              >
                {tHome.fleetViewAll}
                <ArrowRight className="w-5 h-5 transition-transform duration-500 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/#fleet"
                className="inline-flex items-center gap-2 text-[1.0625rem] font-medium text-neutral-900 hover:text-[var(--color-nx-accent)] transition-colors duration-300"
              >
                {tHome.fleetEyebrow}
              </Link>
            </motion.div>

            {/* Reassurance row */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.9 }}
              className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-7 nx-meta text-neutral-600"
            >
              <span className="inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {tHome.heroBadge}
              </span>
              <span className="hidden sm:inline-block w-px h-4 bg-neutral-200" />
              <span>
                <strong className="font-semibold text-neutral-900">4.9</strong>{" "}
                · Beta · CMN
              </span>
            </motion.div>
          </div>

          {/* RIGHT — cinematic transparent vehicle */}
          <div className="relative flex justify-center lg:justify-end">
            {/* soft ground shadow */}
            <div
              aria-hidden
              className="pointer-events-none absolute bottom-[8%] left-1/2 -translate-x-1/2 w-[62%] h-7 rounded-[50%] bg-black/10 blur-2xl"
            />
            <motion.div
              initial={{ opacity: 0, x: 150, scale: 1.04 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 1.35, ease: EASE }}
              className="relative w-full"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{
                  duration: 6,
                  ease: "easeInOut",
                  repeat: Infinity,
                  delay: 1.4,
                }}
              >
                <Image
                  src="/assets/hero/hero-car.webp"
                  alt="Premium vehicle available at Casablanca Mohammed V Airport"
                  width={1155}
                  height={481}
                  priority
                  className="block w-full h-auto max-w-[clamp(420px,46vw,780px)] mx-auto lg:mr-[-4%] lg:ml-auto select-none"
                  draggable={false}
                />
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* BOOKING PANEL */}
        <div id="booking" className="relative z-20 mt-8 md:mt-10 scroll-mt-28">
          <BookingPanel />
        </div>

        {/* Reassurance cards */}
        <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          {[
            {
              icon: Plane,
              t: tHome.trustStep1,
              s: tHome.metricPickup,
            },
            {
              icon: Timer,
              t: tHome.trustStep2,
              s: tHome.metricDeposit,
            },
            {
              icon: ShieldCheck,
              t: tHome.trustStep3,
              s: tHome.metricSupport,
            },
          ].map((r) => (
            <div
              key={r.t}
              className="flex items-start gap-3.5 rounded-2xl border border-neutral-200 bg-white px-5 py-4"
            >
              <span className="shrink-0 mt-0.5 w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center text-[var(--color-nx-accent)]">
                <r.icon strokeWidth={1.7} className="w-4 h-4" />
              </span>
              <div>
                <div className="text-[0.95rem] font-semibold text-neutral-900 leading-tight">
                  {r.t}
                </div>
                <div className="nx-meta text-neutral-500 mt-1">{r.s}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
