"use client";

/**
 * Marquee — ReactBits-style infinite horizontal scroll strip.
 * Items duplicate seamlessly for a continuous loop.
 */
import { motion } from "framer-motion";

interface MarqueeProps {
  items: string[];
  /** Total duration (seconds) for one full loop pass */
  speed?: number;
  className?: string;
  separator?: string;
}

export default function Marquee({
  items,
  speed = 28,
  className = "",
  separator = "·",
}: MarqueeProps) {
  // Duplicate enough times to guarantee seamless fill
  const looped = [...items, ...items, ...items];

  return (
    <div className={`overflow-hidden whitespace-nowrap ${className}`}>
      <motion.div
        animate={{ x: ["0%", "-33.333%"] }}
        transition={{
          repeat: Infinity,
          duration: speed,
          ease: "linear" as const,
        }}
        className="inline-flex gap-10 will-change-transform"
      >
        {looped.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-10">
            <span>{item}</span>
            <span className="opacity-30">{separator}</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}
