"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
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
  // Set after payment confirmation
  reservationId: string | null;
}

// ── Actions ──────────────────────────────────────────────────

interface BookingActions {
  setDates: (pickupEpoch: number, returnEpoch: number) => void;
  setLocation: (loc: PickupLocation) => void;
  setVehicle: (vehicleId: string, pricePerDay: number) => void;
  clearVehicle: () => void;
  setReservationId: (id: string) => void;
  reset: () => void;
}

// ── Helpers ──────────────────────────────────────────────────

function calcDerivedFields(
  pickupEpoch: number | null,
  returnEpoch: number | null,
  pricePerDay: number | null,
): { totalDays: number | null; totalPriceEUR: number | null } {
  if (!pickupEpoch || !returnEpoch || !pricePerDay) {
    return { totalDays: null, totalPriceEUR: null };
  }
  const diffMs = returnEpoch - pickupEpoch;
  // Match backend 24h tranches
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

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
  reservationId: null,
};

// ── Store ────────────────────────────────────────────────────

export const useBookingStore = create<BookingState & BookingActions>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      setDates: (pickupEpoch, returnEpoch) => {
        const { selectedVehiclePricePerDay } = get();
        const derived = calcDerivedFields(
          pickupEpoch,
          returnEpoch,
          selectedVehiclePricePerDay,
        );
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

      setReservationId: (id) => set({ reservationId: id }),

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
        reservationId: state.reservationId,
      }),
    },
  ),
);

// ── Currency store (separate, persisted in localStorage) ─────

interface CurrencyState {
  currency: "EUR" | "MAD";
  /** Live EUR → MAD exchange rate. Default 10.8, updated on mount via useExchangeRate. */
  madRate: number;
  toggleCurrency: () => void;
  setCurrency: (c: "EUR" | "MAD") => void;
  setMadRate: (rate: number) => void;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set) => ({
      currency: "EUR",
      madRate: 10.8,
      toggleCurrency: () =>
        set((s) => ({ currency: s.currency === "EUR" ? "MAD" : "EUR" })),
      setCurrency: (c) => set({ currency: c }),
      setMadRate: (rate) => set({ madRate: rate }),
    }),
    { name: "nexus-currency", storage: createJSONStorage(() => localStorage) },
  ),
);
