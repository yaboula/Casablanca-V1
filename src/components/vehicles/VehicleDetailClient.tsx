"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Check,
  ChevronLeft,
  ChevronRight,
  Fuel,
  Gauge,
  ShieldCheck,
  Users,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Vehicle } from "@/types";
import { useBookingStore, useCurrencyStore } from "@/stores/useBookingStore";
import { getOccupancyHeat } from "@/lib/constants";
import { PICKUP_LOCATION_LABELS, DEPOSIT_AMOUNT_EUR } from "@/lib/constants";

// ── Heat helpers ──────────────────────────────────────────────

function heatColor(v: number) {
  if (v < 0.35) return "bg-emerald-400";
  if (v < 0.7) return "bg-amber-400";
  return "bg-red-400";
}

// ── Specs grid items ──────────────────────────────────────────

function specItems(v: Vehicle) {
  return [
    { icon: Users, label: `${v.seats} plazas` },
    { icon: Briefcase, label: `${v.luggageCount} maletas` },
    { icon: Gauge, label: v.transmission === "AUTOMATIC" ? "Automático" : "Manual" },
    { icon: Fuel, label: "Diésel / Gasolina" },
  ];
}

// ── Component ─────────────────────────────────────────────────

export default function VehicleDetailClient({ vehicle }: { vehicle: Vehicle }) {
  const router = useRouter();
  const {
    pickupDate,
    returnDate,
    pickupLocation,
    totalDays,
    setVehicle,
  } = useBookingStore();

  // Gallery — filter empty strings to avoid next/image crash
  const allImages = (vehicle.imageUrls?.length
    ? vehicle.imageUrls
    : [vehicle.imageUrl]
  ).filter(Boolean) as string[];
  const safeImages = allImages.length > 0 ? allImages : ["/images/vehicles/placeholder.svg"];
  const [activeImg, setActiveImg] = useState(0);
  const [dragDir, setDragDir] = useState(0);

  function nextImg() {
    setDragDir(1);
    setActiveImg((i) => (i + 1) % safeImages.length);
  }
  function prevImg() {
    setDragDir(-1);
    setActiveImg((i) => (i - 1 + safeImages.length) % safeImages.length);
  }

  const totalPrice = totalDays ? totalDays * vehicle.pricePerDay : null;
  const { currency, madRate } = useCurrencyStore();
  const displayPrice = currency === "MAD"
    ? Math.round(vehicle.pricePerDay * madRate)
    : vehicle.pricePerDay;
  const priceLabel = currency === "MAD" ? " DH" : "€";
  const displayTotal = totalDays
    ? (currency === "MAD"
        ? Math.round(totalDays * vehicle.pricePerDay * madRate)
        : totalDays * vehicle.pricePerDay)
    : null;
  const heat = getOccupancyHeat(vehicle.id);

  const fmtDate = (ts: number | null) =>
    ts ? format(new Date(ts), "EEE d MMM · HH:mm", { locale: es }) : "—";

  function handleBook() {
    setVehicle(vehicle.id, vehicle.pricePerDay);
    router.push(`/book/${vehicle.id}`);
  }

  return (
    <main className="min-h-screen bg-brand-bg">
      {/* Back link */}
      <div className="bg-white border-b border-slate-100 px-4 md:px-8 py-3">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/catalog"
            className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-dark transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al catálogo
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* ── Left: Image + specs ─────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* Gallery */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-slate-100 shadow-lg group"
            >
              {/* Active image with AnimatePresence */}
              <AnimatePresence mode="wait" custom={dragDir}>
                <motion.div
                  key={activeImg}
                  custom={dragDir}
                  initial={{ opacity: 0, x: dragDir * 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: dragDir * -40 }}
                  transition={{ duration: 0.3 }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.15}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -50) nextImg();
                    else if (info.offset.x > 50) prevImg();
                  }}
                  className="absolute inset-0 cursor-grab active:cursor-grabbing"
                >
                  <Image
                    src={safeImages[activeImg]}
                    alt={`${vehicle.brand} ${vehicle.model} - foto ${activeImg + 1}`}
                    fill
                    priority={activeImg === 0}
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    className="object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/images/vehicles/placeholder.svg";
                    }}
                  />
                </motion.div>
              </AnimatePresence>

              {/* Nav arrows — only shown when multiple images */}
              {safeImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevImg}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm
                               flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100
                               transition-opacity hover:bg-white z-10"
                  >
                    <ChevronLeft className="w-5 h-5 text-brand-dark" />
                  </button>
                  <button
                    type="button"
                    onClick={nextImg}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm
                               flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100
                               transition-opacity hover:bg-white z-10"
                  >
                    <ChevronRight className="w-5 h-5 text-brand-dark" />
                  </button>
                  {/* Dots */}
                  <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5 z-10">
                    {safeImages.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => { setDragDir(i > activeImg ? 1 : -1); setActiveImg(i); }}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          i === activeImg ? "bg-white w-4" : "bg-white/50"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </motion.div>

            {/* Thumbnails */}
            {safeImages.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {safeImages.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { setDragDir(i > activeImg ? 1 : -1); setActiveImg(i); }}
                    className={`relative shrink-0 w-20 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                      i === activeImg ? "border-brand-primary" : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Image src={url} alt={`Foto ${i + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="mt-6"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                {vehicle.category}
              </span>
              <h1 className="text-3xl md:text-4xl font-black text-brand-dark mt-1">
                {vehicle.brand} {vehicle.model}
              </h1>
            </motion.div>

            {/* Specs grid */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6"
            >
              {specItems(vehicle).map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-2xl px-4 py-3"
                >
                  <s.icon className="w-4 h-4 text-brand-muted" />
                  <span className="text-sm font-semibold text-brand-dark">{s.label}</span>
                </div>
              ))}
            </motion.div>

            {/* Includes */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mt-8"
            >
              <h2 className="text-base font-bold text-brand-dark mb-3">Incluido en el precio</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {vehicle.features.map((f) => (
                  <div
                    key={f}
                    className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5"
                  >
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-sm font-semibold text-brand-dark">{f}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Heat bar */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="mt-8"
            >
              <h2 className="text-base font-bold text-brand-dark mb-3">Disponibilidad</h2>
              <div className="flex gap-1.5 mb-1.5">
                {heat.map((v, i) => (
                  <div key={i} className={`h-2.5 flex-1 rounded-full ${heatColor(v)}`} />
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-brand-muted">
                <span>Lun</span><span>Mar</span><span>Mié</span>
                <span>Jue</span><span>Vie</span><span>Sáb</span><span>Dom</span>
              </div>
            </motion.div>
          </div>

          {/* ── Right: Booking Summary Card ──────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="w-full lg:max-w-sm lg:sticky lg:top-6 self-start"
          >
            <div className="bg-white border border-slate-200 shadow-xl rounded-2xl p-5 md:p-6">
              <h3 className="text-base font-bold text-brand-dark mb-4">Resumen de reserva</h3>

              {/* Summary rows */}
              <div className="rounded-xl bg-slate-50 border border-slate-100 divide-y divide-slate-100 overflow-hidden mb-5">
                <SummaryRow label="Terminal" value={PICKUP_LOCATION_LABELS[pickupLocation]} />
                <SummaryRow label="Recogida" value={fmtDate(pickupDate)} />
                <SummaryRow label="Devolución" value={fmtDate(returnDate)} />
                {totalDays && (
                  <SummaryRow label="Duración" value={`${totalDays} ${totalDays === 1 ? "día" : "días"}`} />
                )}
              </div>

              {/* Price breakdown */}
              <div className="space-y-2 mb-5">
                <div className="flex justify-between text-sm">
                  <span className="text-brand-muted">
                    Alquiler{totalDays ? ` (${totalDays}d × ${displayPrice}${priceLabel})` : ""}
                  </span>
                  <span className="font-bold text-brand-dark">
                    {displayTotal ? `${displayTotal}${priceLabel}` : `${displayPrice}${priceLabel}/día`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-brand-muted">Seguro Todo Riesgo</span>
                  <span className="font-semibold text-emerald-600">Incluido</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-brand-muted">Tag Jawaz (peajes)</span>
                  <span className="font-semibold text-emerald-600">Incluido</span>
                </div>
                <div className="h-px bg-slate-200 my-2" />
                {totalPrice && (
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-brand-dark">Total</span>
                    <span className="font-black text-brand-dark text-lg">{displayTotal}{priceLabel}</span>
                  </div>
                )}
              </div>

              {/* Deposit info */}
              <div className="flex items-start gap-3 bg-brand-primary/5 border border-brand-primary/15 rounded-xl p-3.5 mb-5">
                <div className="w-7 h-7 rounded-lg bg-brand-primary flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-brand-dark">
                    Pagas ahora: {DEPOSIT_AMOUNT_EUR}€
                  </p>
                  <p className="text-xs text-brand-muted mt-0.5">
                    El resto al recoger el coche. Cancelación gratuita 48h antes.
                  </p>
                </div>
              </div>

              {/* CTA */}
              <button
                type="button"
                onClick={handleBook}
                disabled={!totalDays}
                className="w-full min-h-[54px] bg-brand-primary disabled:bg-slate-200 disabled:text-slate-400
                           text-white font-bold text-sm rounded-full
                           flex items-center justify-center gap-2
                           hover:bg-brand-primary-hover active:scale-[0.98]
                           shadow-[0_4px_20px_rgba(37,99,235,0.28)]
                           transition-all duration-200"
              >
                Reservar — {DEPOSIT_AMOUNT_EUR}€
                <ArrowRight className="w-4 h-4" />
              </button>

              {!totalDays && (
                <p className="text-center text-[11px] text-brand-muted mt-3">
                  Selecciona fechas en la{" "}
                  <Link href="/" className="underline hover:text-brand-dark">página principal</Link>{" "}
                  para ver el precio total.
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Mobile bottom bar ─────────────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-md border-t border-slate-200
                      p-4 flex items-center justify-between gap-4 lg:hidden z-40">
        <div>
          <p className="text-lg font-black text-brand-dark leading-none">
            {displayTotal ? `${displayTotal}${priceLabel}` : `${displayPrice}${priceLabel}/día`}
          </p>
          {totalDays && (
            <p className="text-xs text-brand-muted mt-0.5">
              {totalDays} {totalDays === 1 ? "día" : "días"} · {DEPOSIT_AMOUNT_EUR}€ ahora
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleBook}
          disabled={!totalDays}
          className="min-h-[48px] px-6 bg-brand-primary disabled:bg-slate-200 disabled:text-slate-400
                     text-white font-bold text-sm rounded-full flex items-center gap-2
                     hover:bg-brand-primary-hover active:scale-[0.98]
                     shadow-[0_4px_16px_rgba(37,99,235,0.25)] transition-all"
        >
          Reservar
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Spacer for mobile bottom bar */}
      <div className="h-20 lg:hidden" />
    </main>
  );
}

// ── Summary row helper ────────────────────────────────────────

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center px-4 py-2.5 text-sm">
      <span className="text-brand-muted">{label}</span>
      <span className="font-semibold text-brand-dark text-right">{value}</span>
    </div>
  );
}
