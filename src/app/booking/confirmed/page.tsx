"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useBookingStore } from "@/stores/useBookingStore";
import { MOCK_VEHICLES } from "@/lib/mock-data";
import { PICKUP_LOCATION_LABELS } from "@/lib/constants";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  CheckCircle2,
  Calendar,
  MapPin,
  Car,
  ArrowRight,
  Clock,
} from "lucide-react";

// ── Inner component (needs searchParams) ──────────────────────

function ConfirmedContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "—";

  const {
    pickupDate,
    returnDate,
    pickupLocation,
    totalDays,
    totalPriceEUR,
    selectedVehicleId,
  } = useBookingStore();

  const vehicle = MOCK_VEHICLES.find((v) => v.id === selectedVehicleId);

  const fmtDate = (ts: number | null) =>
    ts ? format(new Date(ts), "EEE d MMM · HH:mm", { locale: es }) : "—";

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Success animation */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.6, bounce: 0.4 }}
          className="flex flex-col items-center mb-8"
        >
          <div className="relative mb-4">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            {/* Pulse ring */}
            <motion.div
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 1.8, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.6, ease: "easeOut" }}
              className="absolute inset-0 rounded-full bg-emerald-400"
            />
          </div>
          <h1 className="text-2xl font-black text-brand-dark text-center">
            ¡Reserva confirmada!
          </h1>
          <p className="text-brand-muted text-sm text-center mt-1.5">
            En breve recibirás la confirmación por WhatsApp.
          </p>
        </motion.div>

        {/* Reservation card */}
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-4"
        >
          {/* ID banner */}
          <div className="bg-brand-primary px-5 py-3 flex items-center justify-between">
            <span className="text-white/70 text-xs font-medium">Reserva</span>
            <span className="text-white font-black tracking-wider text-sm">#{id}</span>
          </div>

          <div className="p-5 space-y-3.5">
            {/* Vehicle */}
            {vehicle && (
              <Row icon={Car} label="Vehículo" value={`${vehicle.brand} ${vehicle.model}`} />
            )}
            <Row
              icon={MapPin}
              label="Terminal"
              value={PICKUP_LOCATION_LABELS[pickupLocation]}
            />
            <Row icon={Calendar} label="Recogida" value={fmtDate(pickupDate)} />
            <Row icon={Calendar} label="Devolución" value={fmtDate(returnDate)} />
            {totalDays && (
              <Row icon={Clock} label="Duración" value={`${totalDays} día${totalDays > 1 ? "s" : ""}`} />
            )}

            <div className="h-px bg-slate-100" />

            <div className="flex justify-between text-sm">
              <span className="text-brand-muted">Señal pagada</span>
              <span className="font-black text-emerald-600">10 € ✓</span>
            </div>
            {totalPriceEUR && (
              <div className="flex justify-between text-sm">
                <span className="text-brand-muted">Resto al recoger</span>
                <span className="font-semibold text-brand-dark">{totalPriceEUR - 10} €</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="space-y-3"
        >
          <Link
            href={`/check-in?reservationId=${id}`}
            className="w-full min-h-[52px] bg-brand-primary text-white font-bold text-sm rounded-full
                       flex items-center justify-center gap-2
                       hover:bg-brand-primary-hover active:scale-[0.98]
                       shadow-[0_4px_20px_rgba(37,99,235,0.28)] transition-all"
          >
            Completar check-in ahora
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/dashboard"
            className="w-full min-h-[52px] bg-slate-100 text-brand-muted font-semibold text-sm rounded-full
                       flex items-center justify-center hover:bg-slate-200 transition-colors"
          >
            Lo haré más tarde
          </Link>
        </motion.div>

        <p className="text-center text-xs text-brand-muted mt-4">
          También puedes acceder desde tu{" "}
          <Link href="/dashboard" className="text-brand-primary underline underline-offset-2">
            panel de reservas
          </Link>
        </p>
      </div>
    </div>
  );
}

// ── Page wrapper (Suspense required for useSearchParams) ──────

export default function BookingConfirmedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-brand-bg flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
        </div>
      }
    >
      <ConfirmedContent />
    </Suspense>
  );
}

// ── Helper ───────────────────────────────────────────────────

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <Icon className="w-4 h-4 text-brand-muted shrink-0" />
      <span className="text-brand-muted">{label}</span>
      <span className="ml-auto font-semibold text-brand-dark text-right">{value}</span>
    </div>
  );
}
