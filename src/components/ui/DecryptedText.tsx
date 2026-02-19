"use client";

/**
 * DecryptedText — ReactBits-style character-scramble reveal animation.
 * Chars cycle through random glyphs before resolving to the real letter.
 * Triggers once when the element enters the viewport.
 */
import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$&%";

interface DecryptedTextProps {
  text: string;
  className?: string;
  /** Milliseconds per tick cycle — lower = faster */
  speed?: number;
  /** Delay in ms before animation starts */
  delay?: number;
}

export default function DecryptedText({
  text,
  className = "",
  speed = 35,
  delay = 0,
}: DecryptedTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [displayed, setDisplayed] = useState(text.replace(/[^ ]/g, "_"));

  useEffect(() => {
    if (!isInView) return;

    let iteration = 0;
    let timer: ReturnType<typeof setTimeout>;

    const start = () => {
      const interval = setInterval(() => {
        setDisplayed(
          text
            .split("")
            .map((char, i) => {
              if (char === " ") return " ";
              if (i < iteration) return char;
              return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
            })
            .join("")
        );
        if (iteration >= text.length) clearInterval(interval);
        iteration += 0.6;
      }, speed);

      return interval;
    };

    if (delay > 0) {
      timer = setTimeout(() => { start(); }, delay);
    } else {
      const iv = start();
      return () => clearInterval(iv);
    }

    return () => clearTimeout(timer);
  }, [isInView, text, speed, delay]);

  return (
    <span ref={ref} className={className} aria-label={text}>
      {displayed}
    </span>
  );
}
