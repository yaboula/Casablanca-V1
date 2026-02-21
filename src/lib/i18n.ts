"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import esMessages from "@/messages/es.json";
import frMessages from "@/messages/fr.json";
import enMessages from "@/messages/en.json";

// ── Types ─────────────────────────────────────────────────────

export type Locale = "es" | "fr" | "en";
export type Messages = typeof esMessages;

const messageMap: Record<Locale, Messages> = {
  es: esMessages,
  fr: frMessages,
  en: enMessages as unknown as Messages,
};

export const LOCALE_LABELS: Record<Locale, string> = {
  es: "Español",
  fr: "Français",
  en: "English",
};

// ── Store ─────────────────────────────────────────────────────

interface LocaleState {
  locale: Locale;
  _hasHydrated: boolean;
  setLocale: (l: Locale) => void;
  setHasHydrated: (v: boolean) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: "es",
      _hasHydrated: false,
      setLocale: (l) => set({ locale: l }),
      setHasHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: "nexus-locale",
      storage: createJSONStorage(() => localStorage),
      // Skip auto-rehydration on import — we do it manually after
      // React's first commit to avoid server/client DOM mismatch.
      skipHydration: true,
      // Only persist the locale key, not _hasHydrated
      partialize: (s) => ({ locale: s.locale }),
      onRehydrateStorage: () => (state) => {
        // Called when localStorage rehydration finishes.
        // Flips the flag so useTranslations switches to the real locale.
        state?.setHasHydrated(true);
      },
    }
  )
);

// ── Translation hook ──────────────────────────────────────────

/**
 * Access translations by namespace.
 * Before hydration from localStorage, returns the default ("es") messages
 * to match the server render — prevents DOM mismatch flicker.
 * Usage: const t = useTranslations("hero"); t.title
 */
export function useTranslations<K extends keyof Messages>(namespace: K): Messages[K] {
  const locale = useLocaleStore((s) => (s._hasHydrated ? s.locale : "es"));
  return messageMap[locale][namespace];
}

/**
 * Get the current locale's direction (always ltr — Arabic removed).
 */
export function useDirection(): "ltr" | "rtl" {
  return "ltr";
}
