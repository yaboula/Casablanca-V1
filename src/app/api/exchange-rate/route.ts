import { NextResponse } from "next/server";
import { EUR_TO_MAD_RATE } from "@/lib/constants";

/**
 * GET /api/exchange-rate
 *
 * Returns the current EUR→MAD exchange rate.
 * Fetches from https://api.frankfurter.app (free, no API key required).
 * Response is cached by Next.js for 6 hours (revalidate: 21600).
 * Falls back to the hardcoded constant if the external API is unavailable.
 */
export const revalidate = 21_600; // 6 hours

export async function GET() {
  try {
    const res = await fetch(
      "https://api.frankfurter.app/latest?from=EUR&to=MAD",
      { next: { revalidate: 21_600 } }
    );

    if (!res.ok) {
      throw new Error(`Frankfurter API responded with ${res.status}`);
    }

    const data = (await res.json()) as {
      base: string;
      rates: Record<string, number>;
    };

    const rate = data.rates["MAD"];
    if (!rate || typeof rate !== "number") {
      throw new Error("MAD rate not found in response");
    }

    return NextResponse.json(
      { rate, source: "live", base: "EUR", quote: "MAD" },
      {
        headers: {
          "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=3600",
        },
      }
    );
  } catch (err) {
    // Graceful fallback — never block the UI for a FX rate
    console.warn("[exchange-rate] Failed to fetch live rate, using fallback:", err);
    return NextResponse.json(
      { rate: EUR_TO_MAD_RATE, source: "fallback", base: "EUR", quote: "MAD" },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
        },
      }
    );
  }
}
