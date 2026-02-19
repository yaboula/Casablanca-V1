"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useCurrencyStore } from "@/stores/useBookingStore";
import { EUR_TO_MAD_RATE } from "@/lib/constants";

// ── Types ─────────────────────────────────────────────────────

interface PriceProps {
  /** Amount in EUR — always pass EUR, display layer handles conversion */
  amount: number;
  /** Override display currency (uses global store if omitted) */
  currencyOverride?: "EUR" | "MAD";
  size?: "sm" | "md" | "lg" | "hero";
  /** Animate the number change like a ticker */
  animated?: boolean;
  className?: string;
  /** Show "/ día" suffix */
  perDay?: boolean;
}

// ── Size map ─────────────────────────────────────────────────

const sizeClasses: Record<string, string> = {
  sm: "text-sm font-semibold",
  md: "text-base font-bold",
  lg: "text-2xl font-black",
  hero: "text-5xl font-black tracking-tight",
};

// ── Formatter ────────────────────────────────────────────────

function formatPrice(amount: number, currency: "EUR" | "MAD"): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ── Animated number hook ─────────────────────────────────────

function useAnimatedNumber(target: number) {
  const motionVal = useMotionValue(target);
  const rounded = useTransform(motionVal, (v) => Math.round(v));
  const prevTarget = useRef(target);

  useEffect(() => {
    if (prevTarget.current !== target) {
      const controls = animate(motionVal, target, { duration: 0.45, ease: "easeOut" });
      prevTarget.current = target;
      return controls.stop;
    }
  }, [target, motionVal]);

  return rounded;
}

// ── Component ────────────────────────────────────────────────

export default function Price({
  amount,
  currencyOverride,
  size = "md",
  animated = false,
  className = "",
  perDay = false,
}: PriceProps) {
  const globalCurrency = useCurrencyStore((s) => s.currency);
  const currency = currencyOverride ?? globalCurrency;

  const displayAmount =
    currency === "MAD" ? Math.round(amount * EUR_TO_MAD_RATE) : amount;

  const animatedValue = useAnimatedNumber(displayAmount);

  const formattedStatic = formatPrice(displayAmount, currency);

  if (!animated) {
    return (
      <span className={`${sizeClasses[size]} tabular-nums ${className}`}>
        {formattedStatic}
        {perDay && (
          <span className="text-[0.6em] font-medium opacity-60 ml-1">/ día</span>
        )}
      </span>
    );
  }

  // Animated ticker version
  return (
    <span className={`${sizeClasses[size]} tabular-nums inline-flex items-baseline gap-0.5 ${className}`}>
      {currency === "EUR" ? (
        <>
          <motion.span>{animatedValue}</motion.span>
          <span className="text-[0.7em] font-medium opacity-80"> €</span>
        </>
      ) : (
        <>
          <motion.span>{animatedValue}</motion.span>
          <span className="text-[0.65em] font-medium opacity-70"> DH</span>
        </>
      )}
      {perDay && (
        <span className="text-[0.55em] font-medium opacity-50 ml-1">/ día</span>
      )}
    </span>
  );
}
