import { useState, useEffect } from "react";
import { quoteReservation } from "./booking-service";
import type { QuoteViewModel, PickupLocation } from "./types";

export function useQuote(
  vehicleId: string,
  pickup: string,
  returnDate: string,
  location: string
) {
  const [quote, setQuote] = useState<QuoteViewModel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const key = `${vehicleId}|${pickup}|${returnDate}|${location}`;

  useEffect(() => {
    let active = true;

    if (!pickup || !returnDate) {
      setTimeout(() => {
        if (!active) return;
        setQuote(null);
        setError(null);
        setIsLoading(false);
      }, 0);
      return () => { active = false; };
    }

    const pickupMs = new Date(pickup).getTime();
    const returnMs = new Date(returnDate).getTime();

    if (!Number.isNaN(pickupMs) && !Number.isNaN(returnMs) && returnMs <= pickupMs) {
      setTimeout(() => {
        if (!active) return;
        setQuote(null);
        setError("Return date must be after pickup date.");
        setIsLoading(false);
      }, 0);
      return () => { active = false; };
    }

    setTimeout(() => {
      if (!active) return;
      setIsLoading(true);
      setError(null);
    }, 0);

    const controller = new AbortController();

    const timeoutId = setTimeout(() => {
      quoteReservation(
        {
          vehicleId,
          pickupAt: pickup,
          returnAt: returnDate,
          pickupLocation: (location || "CMN_T1") as PickupLocation,
        },
        controller.signal
      )
        .then((result) => {
          if (controller.signal.aborted) return;
          setIsLoading(false);
          if (result.ok) {
            setQuote(result.quote);
            setError(null);
          } else {
            setQuote(null);
            setError(result.error.message || "Failed to fetch quote.");
          }
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          setIsLoading(false);
          setQuote(null);
          setError("Network error fetching quote.");
        });
    }, 400);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [key, pickup, returnDate, location, vehicleId]);

  return { quote, isLoading, error };
}
