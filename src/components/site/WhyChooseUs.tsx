"use client";

import { motion } from "framer-motion";
import {
  ShieldCheck,
  Sparkles,
  Wallet,
  Headphones,
  KeyRound,
  Clock4,
} from "lucide-react";
import { useTranslations } from "@/lib/i18n";

export default function WhyChooseUs() {
  const tHome = useTranslations("home");

  const benefits = [
    {
      icon: KeyRound,
      title: tHome.step1Title,
      copy: tHome.step1Desc,
    },
    {
      icon: Wallet,
      title: tHome.metricDeposit,
      copy: tHome.step2Desc,
    },
    {
      icon: ShieldCheck,
      title: tHome.incInsurance,
      copy: tHome.step3Desc,
    },
    {
      icon: Sparkles,
      title: tHome.metricDigital,
      copy: tHome.heroSubtitle,
    },
    {
      icon: Headphones,
      title: tHome.metricSupport,
      copy: tHome.howItWorksEyebrow,
    },
    {
      icon: Clock4,
      title: tHome.metricPickup,
      copy: tHome.howItWorksTitle,
    },
  ];

  return (
    <section id="why" className="relative bg-white border-t border-neutral-100">
      <div className="nx-container nx-section">
        {/* Header row */}
        <div className="grid lg:grid-cols-[1fr_1.4fr] gap-10 lg:gap-20 mb-12 md:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="nx-eyebrow text-neutral-600 font-medium">
              {tHome.howItWorksEyebrow}
            </div>
            <h2 className="nx-h2 font-display mt-4 font-light text-neutral-900">
              {tHome.howItWorksTitle}
            </h2>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: 0.12, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg text-neutral-600 max-w-xl lg:self-end leading-relaxed"
          >
            {tHome.heroSubtitle}
          </motion.p>
        </div>

        {/* Benefits grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-neutral-200">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                delay: (i % 3) * 0.08 + Math.floor(i / 3) * 0.12,
                duration: 0.85,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="group p-8 md:p-10 border-b border-r border-neutral-200 hover:bg-neutral-50/70 transition-colors duration-500"
            >
              <div className="w-12 h-12 rounded-xl border border-neutral-300 flex items-center justify-center text-neutral-900 group-hover:border-[var(--color-nx-accent)] group-hover:text-[var(--color-nx-accent)] transition-colors duration-500">
                <b.icon strokeWidth={1.5} className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-display mt-6 font-semibold text-neutral-900">
                {b.title}
              </h3>
              <p className="text-base mt-3 text-neutral-600 leading-relaxed">
                {b.copy}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
