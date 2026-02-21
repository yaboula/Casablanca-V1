"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowRight, Check, Users, Briefcase } from "lucide-react";
import type { Vehicle } from "@/types";
import { getOccupancyHeat } from "@/lib/constants";
import { useBookingStore, useCurrencyStore } from "@/stores/useBookingStore";
import { useTranslations } from "@/lib/i18n";

// ── Heat bar helpers ──────────────────────────────────────────

function heatColor(v: number) {
  if (v < 0.35) return "bg-emerald-400";
  if (v < 0.7) return "bg-amber-400";
  return "bg-red-400";
}

// ── Component ─────────────────────────────────────────────────

interface VehicleCardProps {
  vehicle: Vehicle;
  index?: number;
}

export default function VehicleCard({ vehicle, index = 0 }: VehicleCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const { totalDays, setVehicle } = useBookingStore();
  const { currency, madRate } = useCurrencyStore();
  const tCatalog = useTranslations("catalog");
  const displayPrice = currency === "MAD"
    ? Math.round(vehicle.pricePerDay * madRate)
    : vehicle.pricePerDay;
  const priceLabel = currency === "MAD" ? " DH" : "€";
  const totalPrice = totalDays ? totalDays * vehicle.pricePerDay : null;
  const displayTotal = totalDays
    ? (currency === "MAD"
        ? Math.round(totalDays * vehicle.pricePerDay * madRate)
        : totalDays * vehicle.pricePerDay)
    : null;
  const heat = getOccupancyHeat(vehicle.id);

  // ── 3D parallax ─────────────────────────────────────────────
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const springConfig = { damping: 25, stiffness: 150, mass: 0.5 };
  const sX = useSpring(mouseX, springConfig);
  const sY = useSpring(mouseY, springConfig);

  const rotateX = useTransform(sY, [0, 1], [6, -6]);
  const rotateY = useTransform(sX, [0, 1], [-6, 6]);
  const imgX = useTransform(sX, [0, 1], [-5, 5]);
  const imgY = useTransform(sY, [0, 1], [-5, 5]);

  function handleMouseMove(e: React.MouseEvent) {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  }

  function handleMouseLeave() {
    mouseX.set(0.5);
    mouseY.set(0.5);
    setHovered(false);
  }

  function handleSelect() {
    setVehicle(vehicle.id, vehicle.pricePerDay);
  }

  // ── Availability badge ──────────────────────────────────────
  const avgHeat = heat.reduce((a, b) => a + b, 0) / heat.length;
  const badgeText = avgHeat > 0.65 ? tCatalog.lastUnits : tCatalog.available;
  const badgeDot = avgHeat > 0.65 ? "bg-amber-400" : "bg-emerald-400";

  function heatLabel(vals: number[]) {
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    if (avg > 0.6) return tCatalog.heatHigh;
    if (avg > 0.35) return tCatalog.heatMedium;
    return tCatalog.heatLow;
  }

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: index * 0.06,
        duration: 0.45,
        ease: [0.22, 1, 0.36, 1],
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: hovered ? rotateX : 0,
        rotateY: hovered ? rotateY : 0,
        transformPerspective: 800,
      }}
      data-testid="vehicle-card"
      className="group relative bg-white border border-slate-200 rounded-2xl overflow-hidden
                 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)]
                 transition-shadow duration-300 will-change-transform"
    >
      {/* ── Image section ────────────────────────────────── */}
      <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
        <motion.div
          style={{ x: hovered ? imgX : 0, y: hovered ? imgY : 0 }}
          className="w-full h-full"
        >
          <Image
            src={vehicle.imageUrl}
            alt={`${vehicle.brand} ${vehicle.model}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/images/vehicles/placeholder.svg";
            }}
          />
        </motion.div>

        {/* Availability badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm
                        border border-slate-200/60 rounded-full px-3 py-1.5 text-xs font-semibold text-brand-dark">
          <span className={`w-2 h-2 rounded-full ${badgeDot}`} />
          {badgeText}
        </div>

        {/* Category badge */}
        <div className="absolute top-3 right-3 bg-brand-dark/70 backdrop-blur-sm text-white
                        rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
          {vehicle.category}
        </div>
      </div>

      {/* ── Info section ─────────────────────────────────── */}
      <div className="p-4 md:p-5">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div>
            <h3 className="text-lg font-bold text-brand-dark leading-tight">
              {vehicle.brand} {vehicle.model}
            </h3>
            <p className="text-xs text-brand-muted mt-0.5 flex items-center gap-1.5">
              {vehicle.transmission === "AUTOMATIC" ? tCatalog.transmission.AUTOMATIC : tCatalog.transmission.MANUAL}
              <span className="w-0.5 h-0.5 rounded-full bg-slate-300" />
              <Users className="w-3 h-3" /> {vehicle.seats}
              <span className="w-0.5 h-0.5 rounded-full bg-slate-300" />
              <Briefcase className="w-3 h-3" /> {vehicle.luggageCount}
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 mb-4">
          {vehicle.features.slice(0, 4).map((f) => (
            <span key={f} className="flex items-center gap-1 text-xs text-brand-muted">
              <Check className="w-3 h-3 text-emerald-500" />
              {f}
            </span>
          ))}
        </div>

        {/* Heat bar */}
        <div className="mb-4">
          <div className="flex gap-1 mb-1">
            {heat.map((v, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full ${heatColor(v)} transition-colors`}
              />
            ))}
          </div>
          <p className="text-[10px] text-brand-muted">{heatLabel(heat)}</p>
        </div>

        {/* Price + CTA */}
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-2xl font-black text-brand-dark leading-none">
              {displayPrice}{priceLabel}
              <span className="text-sm font-semibold text-brand-muted ml-1">{tCatalog.perDayUnit}</span>
            </p>
            {displayTotal && (
              <p className="text-xs text-brand-muted mt-1">
                {displayTotal}{priceLabel} {tCatalog.totalLabel} · {totalDays} {totalDays === 1 ? tCatalog.day : tCatalog.days}
              </p>
            )}
          </div>

          <Link
            href={`/catalog/${vehicle.id}`}
            onClick={handleSelect}
            className="min-h-[44px] px-5 bg-brand-primary text-white text-sm font-bold rounded-full
                       flex items-center gap-1.5
                       hover:bg-brand-primary-hover active:scale-[0.97]
                       shadow-[0_4px_16px_rgba(37,99,235,0.25)]
                       transition-all duration-200"
          >
            {tCatalog.details}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
