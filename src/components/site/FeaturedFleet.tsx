"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Wifi, MapPin, Clock } from "lucide-react";
import Link from "next/link";
import { useBookingStore, useCurrencyStore } from "@/stores/useBookingStore";
import { useTranslations } from "@/lib/i18n";

export default function FeaturedFleet() {
  const tHome = useTranslations("home");
  const { currency, madRate } = useCurrencyStore();
  const { pickupDate, returnDate } = useBookingStore();

  const [categoryPrices, setCategoryPrices] = useState<Record<string, number>>(
    {},
  );

  // Fetch real min prices per category from API
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";
    fetch(`${base}/vehicles`)
      .then((r) => r.json())
      .then((json) => {
        const vehicles: Array<{
          category: string;
          pricePerDayEurCents: number;
        }> = json.data ?? [];
        const prices: Record<string, number> = {};
        for (const v of vehicles) {
          const eur = v.pricePerDayEurCents / 100;
          if (!prices[v.category] || eur < prices[v.category])
            prices[v.category] = eur;
        }
        setCategoryPrices(prices);
      })
      .catch(() => {});
  }, []);

  const catalogUrl = useMemo(() => {
    const qs = new URLSearchParams();
    if (pickupDate) qs.set("pickupDate", new Date(pickupDate).toISOString());
    if (returnDate) qs.set("returnDate", new Date(returnDate).toISOString());
    const q = qs.toString();
    return q ? `/catalog?${q}` : "/catalog";
  }, [pickupDate, returnDate]);

  const fi = tHome.fleetIncludes;

  const categories = [
    {
      name: tHome.fleetCat0,
      apiCategory: "COMPACT",
      example: "VW Polo o similar",
      fromPrice: 45,
      imageUrl:
        "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?q=80&w=800&auto=format&fit=crop",
      badge: tHome.fleetCat0Badge,
      includes: [fi.basicInsurance, fi.unlimitedKm],
    },
    {
      name: tHome.fleetCat1,
      apiCategory: "SUV",
      example: "Hyundai Tucson o similar",
      fromPrice: 85,
      imageUrl:
        "https://images.unsplash.com/photo-1519245659620-e859806a8d3b?q=80&w=800&auto=format&fit=crop",
      badge: tHome.fleetCat1Badge,
      includes: [fi.fullInsurance, fi.jawazTag, fi.sim5g],
    },
    {
      name: tHome.fleetCat2,
      apiCategory: "LUXURY",
      example: "Audi A4 o similar",
      fromPrice: 120,
      imageUrl:
        "https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?q=80&w=800&auto=format&fit=crop",
      badge: null,
      includes: [fi.fullInsurance, fi.jawazTag, fi.sim5g],
    },
    {
      name: tHome.fleetCat3,
      apiCategory: "SEDAN",
      example: "Mercedes Clase C o similar",
      fromPrice: 140,
      imageUrl:
        "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=800&auto=format&fit=crop",
      badge: null,
      includes: [fi.fullInsurance, fi.jawazTag, fi.sim5g, fi.premiumCleaning],
    },
  ];

  function displayPrice(cat: (typeof categories)[0]): number {
    const base = categoryPrices[cat.apiCategory] ?? cat.fromPrice;
    return currency === "MAD" ? Math.round(base * madRate) : base;
  }

  return (
    <section id="fleet" className="relative bg-[#FAFAFA] border-t border-neutral-100">
      <div className="nx-container nx-section">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-14"
        >
          <div>
            <div className="nx-eyebrow text-neutral-600 font-medium">
              {tHome.fleetEyebrow}
            </div>
            <h2 className="nx-h2 font-display mt-4 font-light text-neutral-900">
              {tHome.fleetTitle}
            </h2>
          </div>
          <Link
            href={catalogUrl}
            className="inline-flex items-center gap-2 text-[var(--color-nx-accent)] text-sm font-semibold hover:gap-3 transition-all duration-200"
          >
            {tHome.fleetViewAll} <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.apiCategory}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                delay: i * 0.08,
                duration: 0.7,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <Link
                href={catalogUrl}
                className="group relative rounded-2xl overflow-hidden border border-neutral-200 bg-white hover:border-[var(--color-nx-accent)]/30 transition-all duration-300 cursor-pointer block nx-lift"
              >
                {cat.badge && (
                  <span className="absolute top-3 left-3 z-10 text-[10px] font-bold uppercase tracking-wider bg-[var(--color-nx-accent)] text-white px-2.5 py-1 rounded-full">
                    {cat.badge}
                  </span>
                )}
                <div className="relative overflow-hidden h-48 bg-neutral-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cat.imageUrl}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/30 to-transparent" />
                </div>
                <div className="p-5">
                  <p className="text-[10px] text-neutral-500 font-medium uppercase tracking-widest mb-1">
                    {cat.example}
                  </p>
                  <h3 className="text-xl font-bold text-neutral-900 mb-2">
                    {cat.name}
                  </h3>

                  {/* Includes */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {cat.includes.map((inc) => (
                      <span
                        key={inc}
                        className="text-[10px] font-medium text-[var(--color-nx-accent)] bg-[var(--color-nx-accent-soft)] border border-[var(--color-nx-accent)]/10 px-2 py-0.5 rounded-full"
                      >
                        {inc}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                    <div>
                      <span className="text-xs text-neutral-500">
                        {tHome.fleetFrom}{" "}
                      </span>
                      <span className="text-2xl font-black text-[var(--color-nx-accent)]">
                        {displayPrice(cat)}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {currency === "MAD" ? " DH" : "€"}
                        {tHome.fleetPerDay}
                      </span>
                    </div>
                    <span className="w-9 h-9 rounded-full bg-[var(--color-nx-accent-soft)] flex items-center justify-center group-hover:bg-[var(--color-nx-accent)] group-hover:text-white text-[var(--color-nx-accent)] transition-colors duration-200">
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Includes banner */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-6 text-neutral-500 text-xs font-medium"
        >
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[var(--color-nx-accent)]" />{" "}
            {tHome.incInsurance}
          </span>
          <span className="flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 text-[var(--color-nx-accent)]" />{" "}
            {tHome.incSIM}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[var(--color-nx-accent)]" />{" "}
            {tHome.incJawaz}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[var(--color-nx-accent)]" />{" "}
            {tHome.incPickup}
          </span>
        </motion.div>
      </div>
    </section>
  );
}
