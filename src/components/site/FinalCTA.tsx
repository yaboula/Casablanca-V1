"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "@/lib/i18n";

export default function FinalCTA() {
  const tHome = useTranslations("home");

  return (
    <section className="relative bg-[#0A0A0A] text-white overflow-hidden">
      {/* Accent glow */}
      <div
        aria-hidden
        className="absolute -top-60 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{
          background:
            "radial-gradient(closest-side, rgba(30,65,252,0.55), transparent 70%)",
        }}
      />

      <div className="relative nx-container nx-section text-center">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="nx-eyebrow text-neutral-400"
        >
          {tHome.fleetEyebrow}
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="nx-h2 font-display mt-6 font-light max-w-5xl mx-auto"
        >
          {tHome.fleetTitle}
          <br />
          <span className="italic text-neutral-400">
            {tHome.howItWorksTitle}
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.9 }}
          className="text-lg mt-7 text-neutral-400 max-w-xl mx-auto leading-relaxed"
        >
          {tHome.heroSubtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.9 }}
          className="mt-10 flex items-center justify-center gap-x-6 gap-y-4 flex-wrap"
        >
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2.5 bg-white text-[#0A0A0A] hover:bg-[var(--color-nx-accent)] hover:text-white rounded-full pl-8 pr-7 py-[1.05rem] text-[1.0625rem] font-medium transition-colors duration-300"
          >
            {tHome.fleetViewAll}
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/#fleet"
            className="inline-flex items-center gap-2 text-[1.0625rem] font-medium text-neutral-300 hover:text-white transition-colors"
          >
            {tHome.fleetEyebrow}
          </Link>
        </motion.div>

        {/* Stats row */}
        <div className="mt-16 grid grid-cols-3 max-w-2xl mx-auto border-t border-neutral-800 pt-10">
          {[
            { n: "2 min", l: tHome.metricPickup },
            { n: "10€", l: tHome.metricDeposit },
            { n: "24/7", l: tHome.metricSupport },
          ].map((s, i) => (
            <motion.div
              key={s.l}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 + i * 0.1, duration: 0.8 }}
            >
              <div className="font-display text-2xl md:text-3xl font-light">
                {s.n}
              </div>
              <div className="mt-1 text-[0.625rem] uppercase tracking-[0.18em] text-neutral-500">
                {s.l}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
