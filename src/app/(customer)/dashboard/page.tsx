"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  MapPin,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useBookingStore } from "@/stores/useBookingStore";
import { MOCK_VEHICLES } from "@/lib/mock-data";
import { PICKUP_LOCATION_LABELS } from "@/lib/constants";
import type { ReservationStatus } from "@/types";

// ── Mock reservations ─────────────────────────────────────────

interface MockReservation {
  id: string;
  vehicleId: string;
  pickupDate: string;
  returnDate: string;
  pickupLocation: string;
  status: ReservationStatus;
  totalPriceEUR: number;
}

function getMockReservations(): MockReservation[] {
  // In real app: fetch from API
  return [
    {
      id: "CMN-2026-001",
      vehicleId: "v1",
      pickupDate: "2026-02-19T09:00:00Z",
      returnDate: "2026-02-24T09:00:00Z",
      pickupLocation: "CMN_T2",
      status: "IN_PROGRESS",
      totalPriceEUR: 800,
    },
    {
      id: "CMN-2026-002",
      vehicleId: "v2",
      pickupDate: "2026-01-05T10:00:00Z",
      returnDate: "2026-01-10T10:00:00Z",
      pickupLocation: "CMN_T1",
      status: "COMPLETED",
      totalPriceEUR: 950,
    },
  ];
}

// ── Status badge config ───────────────────────────────────────

const STATUS_CONFIG: Record<
  ReservationStatus,
  { label: string; bg: string; text: string }
> = {
  PENDING_DEPOSIT: { label: "Pendiente", bg: "bg-amber-50", text: "text-amber-600" },
  CONFIRMED: { label: "Confirmada", bg: "bg-blue-50", text: "text-blue-600" },
  IN_PROGRESS: { label: "En curso", bg: "bg-emerald-50", text: "text-emerald-600" },
  COMPLETED: { label: "Completada", bg: "bg-slate-100", text: "text-slate-500" },
  CANCELLED: { label: "Cancelada", bg: "bg-red-50", text: "text-red-500" },
};

// ── Page ──────────────────────────────────────────────────────

export default function DashboardPage() {
  const reservations = getMockReservations();

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-2xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl md:text-3xl font-black text-brand-dark">
            Hola, viajero
          </h1>
          <p className="text-sm text-brand-muted mt-1">
            Gestiona tus reservas y documentos.
          </p>
        </motion.div>

        {/* Reservations */}
        <div className="mb-8">
          <h2 className="text-base font-bold text-brand-dark mb-4 flex items-center gap-2">
            <Car className="w-4 h-4 text-brand-primary" />
            Mis Reservas
          </h2>

          {reservations.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3">
              {reservations.map((res, i) => (
                <ReservationCard key={res.id} reservation={res} index={i} />
              ))}
            </div>
          )}
        </div>

        {/* New booking CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Link
            href="/catalog"
            className="w-full min-h-[50px] bg-brand-primary text-white font-bold text-sm rounded-full
                       flex items-center justify-center gap-2
                       hover:bg-brand-primary-hover active:scale-[0.98]
                       shadow-[0_4px_20px_rgba(37,99,235,0.28)] transition-all"
          >
            <Plus className="w-4 h-4" />
            Nueva reserva
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

// ── Reservation card ─────────────────────────────────────────

function ReservationCard({
  reservation,
  index,
}: {
  reservation: MockReservation;
  index: number;
}) {
  const vehicle = MOCK_VEHICLES.find((v) => v.id === reservation.vehicleId);
  const config = STATUS_CONFIG[reservation.status];
  const isActive = reservation.status === "IN_PROGRESS" || reservation.status === "CONFIRMED";

  const pickupFmt = format(new Date(reservation.pickupDate), "d MMM", { locale: es });
  const returnFmt = format(new Date(reservation.returnDate), "d MMM yyyy", { locale: es });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
    >
      <Link
        href={isActive ? `/smart-ticket?reservationId=${reservation.id}` : "#"}
        className={`block bg-white border rounded-2xl p-4 transition-all
          ${isActive ? "border-slate-200 shadow-sm hover:shadow-md hover:border-brand-primary/30" : "border-slate-100 opacity-80"}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-base font-bold text-brand-dark truncate">
                {vehicle ? `${vehicle.brand} ${vehicle.model}` : "Vehículo"}
              </p>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${config.bg} ${config.text}`}>
                {config.label}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-brand-muted">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {PICKUP_LOCATION_LABELS[reservation.pickupLocation] ?? reservation.pickupLocation}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {pickupFmt} – {returnFmt}
              </span>
            </div>
          </div>

          {isActive && (
            <div className="flex items-center gap-1 text-brand-primary shrink-0">
              <span className="text-xs font-semibold hidden sm:inline">Ver ticket</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

// ── Empty state ──────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center">
      <div className="text-4xl mb-3">🚗</div>
      <p className="text-base font-bold text-brand-dark mb-1">No tienes reservas aún</p>
      <p className="text-sm text-brand-muted mb-4">
        Encuentra tu coche ideal en nuestro catálogo.
      </p>
      <Link
        href="/catalog"
        className="inline-flex items-center gap-2 text-sm font-semibold text-brand-primary hover:text-brand-primary-hover transition-colors"
      >
        Explorar catálogo
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
