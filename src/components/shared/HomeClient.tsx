"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { useTranslations } from "@/lib/i18n";

import HeroSection from "@/components/site/HeroSection";
import TrustStrip from "@/components/site/TrustStrip";
import FeaturedFleet from "@/components/site/FeaturedFleet";
import WhyChooseUs from "@/components/site/WhyChooseUs";
import FinalCTA from "@/components/site/FinalCTA";

// ── Component ─────────────────────────────────────────────────

export default function HomeClient() {
  const tHome = useTranslations("home");

  const TESTIMONIALS = [
    {
      name: "Carlos M.",
      route: "CMN → Casablanca",
      rating: 5,
      text: tHome.testimonial0,
    },
    {
      name: "Sophie L.",
      route: "CMN → Marrakech",
      rating: 5,
      text: tHome.testimonial1,
    },
    {
      name: "Ahmed B.",
      route: "CMN → Rabat",
      rating: 5,
      text: tHome.testimonial2,
    },
    {
      name: "Laura G.",
      route: "CMN → Essaouira",
      rating: 5,
      text: tHome.testimonial3,
    },
    {
      name: "Youssef K.",
      route: "CMN → Fez",
      rating: 5,
      text: tHome.testimonial4,
    },
    {
      name: "María T.",
      route: "CMN → Agadir",
      rating: 5,
      text: tHome.testimonial5,
    },
  ];

  return (
    <div className="relative w-full bg-white text-neutral-900 overflow-x-hidden">
      {/* 1. HERO */}
      <HeroSection />

      {/* 2. TRUST STRIP — Brand Marquee */}
      <TrustStrip />

      {/* 3. FEATURED FLEET */}
      <FeaturedFleet />

      {/* 4. WHY CHOOSE US */}
      <WhyChooseUs />

      {/* 5. TESTIMONIALS */}
      <TestimonialsCarousel
        eyebrow={tHome.testimonialsEyebrow}
        title={tHome.testimonialsTitle}
        testimonials={TESTIMONIALS}
      />

      {/* 6. FINAL CTA */}
      <FinalCTA />
    </div>
  );
}

/* ── Testimonials carousel component ──────────────────────────── */
interface TestimonialsCarouselProps {
  eyebrow: string;
  title: string;
  testimonials: Array<{
    name: string;
    route: string;
    rating: number;
    text: string;
  }>;
}

function TestimonialsCarousel({
  eyebrow,
  title,
  testimonials,
}: TestimonialsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let raf: number;
    let scrollPos = 0;
    const speed = 0.5;

    const tick = () => {
      scrollPos += speed;
      if (scrollPos >= el.scrollWidth / 2) {
        scrollPos = 0;
      }
      el.scrollLeft = scrollPos;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const pause = () => cancelAnimationFrame(raf);
    const resume = () => {
      raf = requestAnimationFrame(tick);
    };
    el.addEventListener("mouseenter", pause);
    el.addEventListener("mouseleave", resume);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("mouseenter", pause);
      el.removeEventListener("mouseleave", resume);
    };
  }, []);

  const doubled = [...testimonials, ...testimonials];

  return (
    <section className="bg-[#FAFAFA] border-y border-neutral-100 nx-section">
      <div className="nx-container">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] as const }}
          className="mb-12"
        >
          <div className="nx-eyebrow text-neutral-600 font-medium mb-4">
            {eyebrow}
          </div>
          <h2 className="nx-h2 font-display font-light text-neutral-900">
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
            className="flex-shrink-0 w-[340px] rounded-2xl border border-neutral-200 bg-white p-7 flex flex-col"
          >
            <div className="flex gap-0.5 mb-4">
              {[...Array(t.rating)].map((_, i) => (
                <Star
                  key={i}
                  className="w-3.5 h-3.5 fill-amber-400 text-amber-400"
                />
              ))}
            </div>
            <p className="text-neutral-900 text-[15px] leading-relaxed font-medium flex-1 mb-5">
              &ldquo;{t.text}&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[var(--color-nx-accent-soft)] border border-[var(--color-nx-accent)]/20 flex items-center justify-center text-[var(--color-nx-accent)] font-bold text-sm flex-shrink-0">
                {t.name[0]}
              </div>
              <div>
                <p className="text-neutral-900 font-semibold text-sm leading-none mb-0.5">
                  {t.name}
                </p>
                <p className="text-neutral-500 text-xs">{t.route}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
