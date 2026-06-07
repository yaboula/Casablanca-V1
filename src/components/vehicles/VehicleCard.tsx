"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Star } from "lucide-react";
import type { Vehicle } from "@/types";
import { getOccupancyHeat } from "@/lib/constants";
import { useBookingStore, useCurrencyStore } from "@/stores/useBookingStore";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// ── Component ─────────────────────────────────────────────────

interface VehicleCardProps {
  vehicle: Vehicle;
  index?: number;
}

export default function VehicleCard({ vehicle, index = 0 }: VehicleCardProps) {
  const { totalDays, setVehicle } = useBookingStore();
  const { currency, madRate } = useCurrencyStore();
  const tCatalog = useTranslations("catalog");
  
  const displayPrice = currency === "MAD"
    ? Math.round(vehicle.pricePerDay * madRate)
    : vehicle.pricePerDay;
  const priceLabel = currency === "MAD" ? " DH" : "€";
  
  const displayTotal = totalDays
    ? (currency === "MAD"
        ? Math.round(totalDays * vehicle.pricePerDay * madRate)
        : totalDays * vehicle.pricePerDay)
    : null;
    
  const depositPrice = currency === "MAD"
    ? Math.round(10 * madRate) // Dummy deposit 10€ -> MAD
    : 10;

  const heat = getOccupancyHeat(vehicle.id);
  const avgHeat = heat.reduce((a, b) => a + b, 0) / heat.length;
  const isLastUnits = avgHeat > 0.65;
  const badgeText = isLastUnits ? tCatalog.lastUnits : tCatalog.available;
  const badgeDot = isLastUnits ? "bg-amber-400" : "bg-emerald-400";

  function handleSelect() {
    setVehicle(vehicle.id, vehicle.pricePerDay);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.3), duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        href={`/catalog/${vehicle.id}`}
        onClick={handleSelect}
        data-testid="vehicle-card"
        className="group block bg-white border border-neutral-200 rounded-[1.25rem] overflow-hidden transition-colors duration-300 hover:border-neutral-400"
      >
        {/* ── Image section ────────────────────────────────── */}
        <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100">
          <Image
            src={vehicle.imageUrl}
            alt={`${vehicle.brand} ${vehicle.model}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/images/vehicles/placeholder.svg";
            }}
          />
          <div className="absolute top-4 left-4 inline-flex items-center gap-2 bg-white rounded-full px-3 py-1.5 border border-neutral-200 shadow-sm">
            <span className={`w-1.5 h-1.5 rounded-full ${badgeDot}`} />
            <span className="text-[0.7rem] uppercase tracking-[0.16em] font-semibold text-neutral-900">
              {badgeText}
            </span>
          </div>
          <div className="absolute top-4 right-4 inline-flex items-center gap-1 bg-white rounded-full px-2.5 py-1.5 border border-neutral-200 shadow-sm">
            <Star className="w-3.5 h-3.5 text-[#1E41FC] fill-[#1E41FC]" />
            <span className="text-[0.78rem] font-semibold text-neutral-900">
              4.9
            </span>
          </div>
        </div>

        {/* ── Info section ─────────────────────────────────── */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-[1.35rem] font-semibold text-neutral-900 leading-tight">
                {vehicle.brand} {vehicle.model}
              </h3>
              <p className="nx-meta text-neutral-500 mt-1.5 line-clamp-1">
                {vehicle.features.slice(0, 3).join(" • ")}
              </p>
            </div>
            {/* Tag/Status badge right side */}
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border-emerald-200/50">
              {vehicle.category}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 border-y border-neutral-100 py-4">
             <div>
                 <div className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-neutral-400">
                     Trans
                 </div>
                 <div className="font-display text-[1.05rem] font-medium text-neutral-900 mt-1">
                     {vehicle.transmission === "AUTOMATIC" ? "Auto" : "Man"}
                 </div>
             </div>
             <div>
                 <div className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-neutral-400">
                     Seats
                 </div>
                 <div className="font-display text-[1.05rem] font-medium text-neutral-900 mt-1">
                     {vehicle.seats}
                 </div>
             </div>
             <div>
                 <div className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-neutral-400">
                     Luggage
                 </div>
                 <div className="font-display text-[1.05rem] font-medium text-neutral-900 mt-1">
                     {vehicle.luggageCount}
                 </div>
             </div>
          </div>

          <div className="mt-5 flex items-end justify-between">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="font-display text-[1.9rem] font-light tracking-tight text-neutral-900 leading-none">
                  {displayPrice}
                </span>
                <span className="nx-meta text-neutral-500">{priceLabel} /day</span>
              </div>
              <div className="nx-meta text-neutral-400 mt-1.5 flex gap-1 items-center">
                <span>{displayTotal ? `${tCatalog.totalLabel} ${displayTotal}${priceLabel} • ` : ""} Deposit {depositPrice}{priceLabel}</span>
              </div>
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[0.9rem] font-medium transition-colors duration-300",
                "bg-[#0A0A0A] text-white group-hover:bg-[#1E41FC]"
              )}
            >
              {tCatalog.details}
              <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
