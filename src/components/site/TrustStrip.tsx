"use client";

import { motion } from "framer-motion";

const brands = [
  "Mercedes-Benz",
  "BMW",
  "Audi",
  "Range Rover",
  "Porsche",
  "Lexus",
  "Genesis",
  "Maserati",
];

export default function TrustStrip() {
  return (
    <section className="relative bg-white border-t border-neutral-100">
      <div className="nx-container py-10 md:py-14">
        <div className="grid md:grid-cols-[1fr_2fr] gap-10 md:gap-16 lg:gap-20 items-center">
          {/* Left copy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="nx-eyebrow text-neutral-600 font-medium">
              Curated fleet
            </div>
            <h2 className="nx-h3 font-display mt-3 font-light text-neutral-900 max-w-sm">
              The world&apos;s finest marques.
              <span className="text-neutral-400"> Hand-selected.</span>
            </h2>
          </motion.div>

          {/* Brand marquee */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2 }}
            className="relative overflow-hidden"
            style={{
              WebkitMaskImage:
                "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
              maskImage:
                "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
            }}
          >
            <div className="flex gap-14 md:gap-20 whitespace-nowrap nx-marquee w-max">
              {[...brands, ...brands].map((name, i) => (
                <span
                  key={`${name}-${i}`}
                  className="font-display text-2xl md:text-[1.9rem] font-light text-neutral-400 hover:text-neutral-900 transition-colors duration-500"
                >
                  {name}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
