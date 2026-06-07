"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useBookingStore } from "@/stores/useBookingStore";
import { PICKUP_LOCATION_LABELS } from "@/lib/constants";
import { apiFetch } from "@/lib/api";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  CheckCircle2,
  Calendar,
  MapPin,
  Car,
  ArrowRight,
  Clock,
  Loader2,
  AlertCircle,
  TimerOff,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────

type ConfirmationStatus = "polling" | "confirmed" | "timeout" | "error";

interface ReservationVehicle {
  brand: string;
  model: string;
  imageUrl?: string;
}

interface Reservation {
  id: string;
  status: string;
  pickupDate: string;
  returnDate: string;
  pickupLocation: string;
  totalDays: number;
  /** total_price_eur_cents from entity */
  totalPriceEurCents?: number;
  /** deposit_eur_cents from entity */
  depositEurCents?: number;
  vehicle?: ReservationVehicle;
}

// ── Constants ─────────────────────────────────────────────────

const MAX_ATTEMPTS = 10;
const POLL_INTERVAL_MS = 2000;

// ── Inner component (needs searchParams) ──────────────────────

function ConfirmedContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? null;

  const { pickupDate, returnDate, pickupLocation, totalDays, totalPriceEUR } =
    useBookingStore();

  const [status, setStatus] = useState<ConfirmationStatus>("polling");
  const [reservation, setReservation] = useState<Reservation | null>(null);

  // T3-6 — Polling loop: wait for Stripe webhook to update reservation status
  useEffect(() => {
    if (!id) {
      setStatus("error");
      return;
    }
    let attempt = 0;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const raw = await apiFetch<{ data: Reservation } | Reservation>(
          `/reservations/${id}`,
          {
            auth: true,
          },
        );
        // NestJS wraps single-entity responses in { data: {...} }
        const res: Reservation =
          (raw as { data: Reservation }).data ?? (raw as Reservation);
        if (res.status === "CONFIRMED" || res.status === "IN_PROGRESS") {
          setReservation(res);
          setStatus("confirmed");
          // Bug 19 fix: Clear booking store after successful confirmation
          useBookingStore.getState().reset();
        } else if (res.status === "CANCELLED") {
          setStatus("error");
        } else if (res.status === "AWAITING_CAPTURE") {
          // Bug 18 fix: Payment is being captured — keep polling without counting attempt
          timer = setTimeout(poll, POLL_INTERVAL_MS);
        } else {
          // PENDING_DEPOSIT — webhook hasn't arrived yet
          attempt++;
          if (attempt >= MAX_ATTEMPTS) {
            setStatus("timeout");
          } else {
            timer = setTimeout(poll, POLL_INTERVAL_MS);
          }
        }
      } catch {
        setStatus("error");
      }
    }

    poll();
    return () => clearTimeout(timer);
  }, [id]);

  // ── Polling screen ─────────────────────────────────────────
  if (status === "polling") {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-brand-primary animate-spin mx-auto" />
          <h2 className="text-lg font-bold text-brand-dark">
            Confirmando tu pago con el banco...
          </h2>
          <p className="text-sm text-brand-muted max-w-xs mx-auto">
            Estamos procesando tu reserva. Esto solo tardará unos segundos.
          </p>
        </div>
      </div>
    );
  }

  // ── Timeout screen ─────────────────────────────────────────
  if (status === "timeout") {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
            <TimerOff className="w-8 h-8 text-amber-600" />
          </div>
          <div>
            <h2 className="text-xl font-black text-brand-dark">
              Tu pago está siendo procesado
            </h2>
            <p className="text-sm text-brand-muted mt-2 max-w-sm mx-auto">
              Te enviaremos la confirmación por email y WhatsApp en los próximos
              minutos. Referencia:{" "}
              <span className="font-mono font-semibold">#{id ?? "—"}</span>
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 min-h-[48px] px-6 bg-brand-primary
                       text-white font-bold text-sm rounded-full
                       hover:bg-brand-primary-hover transition-colors"
          >
            Ver mis reservas
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // ── Error screen ────────────────────────────────────────────
  if (status === "error") {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h2 className="text-xl font-black text-brand-dark">Algo fue mal</h2>
            {id && (
              <p className="text-sm text-brand-muted mt-1">
                Referencia:{" "}
                <span className="font-mono font-semibold">#{id}</span>
              </p>
            )}
            <p className="text-sm text-brand-muted mt-2">
              Contacta con soporte indicando tu referencia de reserva.
            </p>
          </div>
          <a
            href={`https://wa.me/34600000000?text=Problema%20con%20reserva%20${id ?? ""}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 min-h-[48px] px-6 bg-emerald-500
                       text-white font-bold text-sm rounded-full
                       hover:bg-emerald-600 transition-colors"
          >
            Contactar por WhatsApp
          </a>
        </div>
      </div>
    );
  }

  // ── Success screen ─────────────────────────────────────────
  const res = reservation!;
  const vehicleName = res.vehicle
    ? `${res.vehicle.brand} ${res.vehicle.model}`
    : null;

  // Prefer server dates; fall back to Zustand store dates
  const fmtServerDate = (iso: string) =>
    format(new Date(iso), "EEE d MMM · HH:mm", { locale: es });
  const fmtStoreDate = (ts: number | null) =>
    ts ? format(new Date(ts), "EEE d MMM · HH:mm", { locale: es }) : "—";

  const pickupStr = res.pickupDate
    ? fmtServerDate(res.pickupDate)
    : fmtStoreDate(pickupDate);
  const returnStr = res.returnDate
    ? fmtServerDate(res.returnDate)
    : fmtStoreDate(returnDate);
  const locationLabel =
    PICKUP_LOCATION_LABELS[res.pickupLocation ?? pickupLocation] ??
    res.pickupLocation ??
    pickupLocation;
  const days = res.totalDays ?? totalDays;
  const depositEur = res.depositEurCents ? res.depositEurCents / 100 : 10;
  const totalEur = res.totalPriceEurCents
    ? res.totalPriceEurCents / 100
    : (totalPriceEUR ?? 0);

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
            {searchParams.get("demo") === "1" || process.env.NEXT_PUBLIC_BYPASS_PAYMENT === "true" ? "Modo demo local: la reserva quedó confirmada sin cobrar Stripe." : "En breve recibirás la confirmación por WhatsApp."}
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
            <span className="text-white font-black tracking-wider text-sm">
              #{res.id}
            </span>
          </div>

          <div className="p-5 space-y-3.5">
            {vehicleName && (
              <Row icon={Car} label="Vehículo" value={vehicleName} />
            )}
            <Row icon={MapPin} label="Terminal" value={locationLabel} />
            <Row icon={Calendar} label="Recogida" value={pickupStr} />
            <Row icon={Calendar} label="Devolución" value={returnStr} />
            {days && (
              <Row
                icon={Clock}
                label="Duración"
                value={`${days} día${days > 1 ? "s" : ""}`}
              />
            )}

            <div className="h-px bg-slate-100" />

            <div className="flex justify-between text-sm">
              <span className="text-brand-muted">
                {searchParams.get("demo") === "1" || process.env.NEXT_PUBLIC_BYPASS_PAYMENT === "true" ? "Demo deposit" : "Deposit paid"}
              </span>
              <span
                className={searchParams.get("demo") === "1" || process.env.NEXT_PUBLIC_BYPASS_PAYMENT === "true" ? "font-black text-amber-700" : "font-black text-emerald-600"}
              >
                {depositEur} EUR {searchParams.get("demo") === "1" || process.env.NEXT_PUBLIC_BYPASS_PAYMENT === "true" ? "demo" : "ok"}
              </span>
            </div>
            {totalEur > depositEur && (
              <div className="flex justify-between text-sm">
                <span className="text-brand-muted">Resto al recoger</span>
                <span className="font-semibold text-brand-dark">
                  {(totalEur - depositEur).toFixed(2)} EUR
                </span>
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
            href={`/check-in?reservationId=${res.id}`}
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
          <Link
            href="/dashboard"
            className="text-brand-primary underline underline-offset-2"
          >
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
      <span className="ml-auto font-semibold text-brand-dark text-right">
        {value}
      </span>
    </div>
  );
}


