"use client";

import { useEffect } from "react";
import { useCurrencyStore } from "@/stores/useBookingStore";

/**
 * Fetches the live EUR→MAD exchange rate from /api/exchange-rate once on mount
 * and stores it in useCurrencyStore.madRate.
 *
 * Mount this hook in LayoutShell so it runs exactly once per session.
 * Falls back silently to the store's default (10.8) if the request fails.
 */
export function useExchangeRate() {
  const setMadRate = useCurrencyStore((s) => s.setMadRate);

  useEffect(() => {
    fetch("/api/exchange-rate")
      .then((r) => r.json())
      .then((data: { rate: number }) => {
        if (typeof data.rate === "number" && data.rate > 0) {
          setMadRate(data.rate);
        }
      })
      .catch(() => {
        // silent fail — store retains its current value
      });
  }, [setMadRate]);
}
