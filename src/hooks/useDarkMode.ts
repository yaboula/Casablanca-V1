"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ── Store ─────────────────────────────────────────────────────

interface DarkModeState {
  isDark: boolean;
  toggle: () => void;
  setDark: (v: boolean) => void;
}

export const useDarkModeStore = create<DarkModeState>()(
  persist(
    (set) => ({
      isDark: false,
      toggle: () => set((s) => ({ isDark: !s.isDark })),
      setDark: (v) => set({ isDark: v }),
    }),
    { name: "nexus-theme", storage: createJSONStorage(() => localStorage) }
  )
);

// ── Hook ──────────────────────────────────────────────────────

/**
 * Manages the `.dark` class on `<html>` based on user preference.
 * - Reads preference from localStorage (persisted via Zustand)
 * - Falls back to `prefers-color-scheme: dark` on first visit
 * - Syncs class on every render when `isDark` changes
 *
 * Mount this hook once in LayoutShell.
 */
export function useDarkMode() {
  const { isDark, toggle, setDark } = useDarkModeStore();

  // Apply .dark class whenever preference changes
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  // On first visit (no stored preference), honour system setting
  useEffect(() => {
    const stored = localStorage.getItem("nexus-theme");
    if (!stored) {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setDark(prefersDark);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isDark, toggle };
}
