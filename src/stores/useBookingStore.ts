"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { differenceInCalendarDays, startOfDay } from "date-fns";
import type { PickupLocation } from "@/types";

// ── State shape ──────────────────────────────────────────────

interface BookingState {
  // Dates stored as epoch timestamps (ms) for easy serialization
  pickupDate: number | null;
  returnDate: number | null;
  pickupLocation: PickupLocation;
  selectedVehicleId: string | null;
  selectedVehiclePricePerDay: number | null;
  // Derived — recalculated automatically when dates or price change
  totalDays: number | null;
  totalPriceEUR: number | null;
}

// ── Actions ──────────────────────────────────────────────────

interface BookingActions {
  setDates: (pickupEpoch: number, returnEpoch: number) => void;
  setLocation: (loc: PickupLocation) => void;
  setVehicle: (vehicleId: string, pricePerDay: number) => void;
  clearVehicle: () => void;
  reset: () => void;
}

// ── Helpers ──────────────────────────────────────────────────

function calcDerivedFields(
  pickupEpoch: number | null,
  returnEpoch: number | null,
  pricePerDay: number | null
): { totalDays: number | null; totalPriceEUR: number | null } {
  if (!pickupEpoch || !returnEpoch || !pricePerDay) {
    return { totalDays: null, totalPriceEUR: null };
  }
  const days = differenceInCalendarDays(
    startOfDay(new Date(returnEpoch)),
    startOfDay(new Date(pickupEpoch))
  );
  if (days <= 0) return { totalDays: null, totalPriceEUR: null };
  return { totalDays: days, totalPriceEUR: days * pricePerDay };
}

// ── Initial state ────────────────────────────────────────────

const INITIAL_STATE: BookingState = {
  pickupDate: null,
  returnDate: null,
  pickupLocation: "CMN_T2",
  selectedVehicleId: null,
  selectedVehiclePricePerDay: null,
  totalDays: null,
  totalPriceEUR: null,
};

// ── Store ────────────────────────────────────────────────────

export const useBookingStore = create<BookingState & BookingActions>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      setDates: (pickupEpoch, returnEpoch) => {
        const { selectedVehiclePricePerDay } = get();
        const derived = calcDerivedFields(pickupEpoch, returnEpoch, selectedVehiclePricePerDay);
        set({ pickupDate: pickupEpoch, returnDate: returnEpoch, ...derived });
      },

      setLocation: (loc) => set({ pickupLocation: loc }),

      setVehicle: (vehicleId, pricePerDay) => {
        const { pickupDate, returnDate } = get();
        const derived = calcDerivedFields(pickupDate, returnDate, pricePerDay);
        set({
          selectedVehicleId: vehicleId,
          selectedVehiclePricePerDay: pricePerDay,
          ...derived,
        });
      },

      clearVehicle: () =>
        set({
          selectedVehicleId: null,
          selectedVehiclePricePerDay: null,
          totalPriceEUR: null,
        }),

      reset: () => set(INITIAL_STATE),
    }),
    {
      name: "nexus-booking",
      storage: createJSONStorage(() => sessionStorage),
      // Only persist dates, location and vehicle — not derived fields
      partialize: (state) => ({
        pickupDate: state.pickupDate,
        returnDate: state.returnDate,
        pickupLocation: state.pickupLocation,
        selectedVehicleId: state.selectedVehicleId,
        selectedVehiclePricePerDay: state.selectedVehiclePricePerDay,
      }),
    }
  )
);

// ── Currency store (separate, persisted in localStorage) ─────

interface CurrencyState {
  currency: "EUR" | "MAD";
  toggleCurrency: () => void;
  setCurrency: (c: "EUR" | "MAD") => void;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set) => ({
      currency: "EUR",
      toggleCurrency: () =>
        set((s) => ({ currency: s.currency === "EUR" ? "MAD" : "EUR" })),
      setCurrency: (c) => set({ currency: c }),
    }),
    { name: "nexus-currency", storage: createJSONStorage(() => localStorage) }
  )
);
