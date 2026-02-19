"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import esMessages from "@/messages/es.json";
import frMessages from "@/messages/fr.json";
import arMessages from "@/messages/ar.json";

// ── Types ─────────────────────────────────────────────────────

export type Locale = "es" | "fr" | "ar";
export type Messages = typeof esMessages;

const messageMap: Record<Locale, Messages> = {
  es: esMessages,
  fr: frMessages,
  ar: arMessages,
};

export const LOCALE_LABELS: Record<Locale, string> = {
  es: "ES",
  fr: "FR",
  ar: "AR",
};

// ── Store ─────────────────────────────────────────────────────

interface LocaleState {
  locale: Locale;
  setLocale: (l: Locale) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: "es",
      setLocale: (l) => set({ locale: l }),
    }),
    {
      name: "nexus-locale",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// ── Translation hook ──────────────────────────────────────────

/**
 * Access translations by namespace.
 * Usage: const t = useTranslations("hero"); t.title
 */
export function useTranslations<K extends keyof Messages>(namespace: K): Messages[K] {
  const locale = useLocaleStore((s) => s.locale);
  return messageMap[locale][namespace];
}

/**
 * Get the current locale's direction (ltr or rtl).
 */
export function useDirection(): "ltr" | "rtl" {
  const locale = useLocaleStore((s) => s.locale);
  return locale === "ar" ? "rtl" : "ltr";
}
