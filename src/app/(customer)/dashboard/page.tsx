"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  MapPin,
  Headphones,
  MessageCircle,
  Phone,
  Plane,
  Plus,
  QrCode,
  Shield,
  Star,
  Upload,
  User,
  Wifi,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { format, differenceInHours, differenceInDays, isPast } from "date-fns";
import { es } from "date-fns/locale";
import { MOCK_VEHICLES } from "@/lib/mock-data";
import { PICKUP_LOCATION_LABELS, OPERATOR_WHATSAPP } from "@/lib/constants";
import type { ReservationStatus, DocumentStatus } from "@/types";

// ══════════════════════════════════════════════════════════════
// MOCK DATA — replaced by API calls when backend is ready
// ══════════════════════════════════════════════════════════════

interface MockReservation {
  id: string;
  vehicleId: string;
  pickupDate: string;
  returnDate: string;
  pickupLocation: string;
  status: ReservationStatus;
  totalPriceEUR: number;
  depositPaidEUR: number;
  balanceDueEUR: number;
  totalDays: number;
  documents: {
    passport: DocumentStatus;
    license: DocumentStatus;
  };
  includesJawaz: boolean;
  includesSIM: boolean;
  includesInsurance: boolean;
}

const MOCK_USER = {
  fullName: "Ahmed Benjelloun",
  email: "ahmed@example.com",
  phone: "+212 612 34 56 78",
  memberSince: "2025-11-01",
  totalTrips: 3,
};

function getMockReservations(): MockReservation[] {
  return [
    {
      id: "CMN-2026-001",
      vehicleId: "v1",
      pickupDate: "2026-02-21T09:00:00Z",
      returnDate: "2026-02-26T09:00:00Z",
      pickupLocation: "CMN_T2",
      status: "CONFIRMED",
      totalPriceEUR: 800,
      depositPaidEUR: 10,
      balanceDueEUR: 790,
      totalDays: 5,
      documents: { passport: "APPROVED", license: "PENDING_REVIEW" },
      includesJawaz: true,
      includesSIM: true,
      includesInsurance: true,
    },
    {
      id: "CMN-2026-002",
      vehicleId: "v2",
      pickupDate: "2026-01-05T10:00:00Z",
      returnDate: "2026-01-10T10:00:00Z",
      pickupLocation: "CMN_T1",
      status: "COMPLETED",
      totalPriceEUR: 950,
      depositPaidEUR: 10,
      balanceDueEUR: 940,
      totalDays: 5,
      documents: { passport: "APPROVED", license: "APPROVED" },
      includesJawaz: true,
      includesSIM: true,
      includesInsurance: true,
    },
    {
      id: "CMN-2025-008",
      vehicleId: "v3",
      pickupDate: "2025-12-20T08:00:00Z",
      returnDate: "2025-12-27T08:00:00Z",
      pickupLocation: "CMN_T2",
      status: "COMPLETED",
      totalPriceEUR: 840,
      depositPaidEUR: 10,
      balanceDueEUR: 830,
      totalDays: 7,
      documents: { passport: "APPROVED", license: "APPROVED" },
      includesJawaz: true,
      includesSIM: false,
      includesInsurance: true,
    },
  ];
}

// ── Status config ─────────────────────────────────────────────

const STATUS_CONFIG: Record<
  ReservationStatus,
  { label: string; bg: string; text: string; icon: React.ElementType }
> = {
  PENDING_DEPOSIT: { label: "Pendiente", bg: "bg-amber-50", text: "text-amber-600", icon: Clock },
  CONFIRMED: { label: "Confirmada", bg: "bg-blue-50", text: "text-blue-600", icon: CheckCircle2 },
  IN_PROGRESS: { label: "En curso", bg: "bg-emerald-50", text: "text-emerald-600", icon: Car },
  COMPLETED: { label: "Completada", bg: "bg-slate-100", text: "text-slate-500", icon: CheckCircle2 },
  CANCELLED: { label: "Cancelada", bg: "bg-red-50", text: "text-red-500", icon: Clock },
};

const DOC_STATUS_LABELS: Record<DocumentStatus, { label: string; color: string }> = {
  PENDING_REVIEW: { label: "En revisión", color: "text-amber-600" },
  APPROVED: { label: "Verificado", color: "text-emerald-600" },
  REJECTED: { label: "Acción requerida", color: "text-red-600" },
};

// ══════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ══════════════════════════════════════════════════════════════

export default function DashboardPage() {
  const reservations = getMockReservations();
  const [username, setUsername] = useState(MOCK_USER.fullName);

  useEffect(() => {
    const match = document.cookie.match(/nexus_session=([^;]+)/);
    if (match) {
      try {
        const session = JSON.parse(decodeURIComponent(match[1]));
        if (session?.email) setUsername(session.email.split("@")[0]);
      } catch {
        /* ignore */
      }
    }
  }, []);

  const activeReservation = useMemo(
    () =>
      reservations.find(
        (r) =>
          r.status === "CONFIRMED" ||
          r.status === "IN_PROGRESS" ||
          r.status === "PENDING_DEPOSIT"
      ),
    [reservations]
  );

  const pastReservations = useMemo(
    () => reservations.filter((r) => r.status === "COMPLETED" || r.status === "CANCELLED"),
    [reservations]
  );

  // Live countdown
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const hoursUntilPickup = activeReservation
    ? differenceInHours(new Date(activeReservation.pickupDate), now)
    : null;
  const daysUntilPickup = activeReservation
    ? differenceInDays(new Date(activeReservation.pickupDate), now)
    : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-10">
        {/* ── §1 Welcome Header ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900">
              Hola, {username.split(" ")[0]} 👋
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {activeReservation
                ? "Tu próximo viaje está casi listo"
                : "¿Listo para tu próxima aventura?"}
            </p>
          </div>
          <Link
            href="/profile"
            className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center hover:bg-blue-100 transition-colors"
          >
            <User className="w-5 h-5 text-blue-600" />
          </Link>
        </motion.div>

        {/* ── §2 Active Reservation Hero ───────────────────── */}
        {activeReservation && (
          <ActiveReservationHero
            reservation={activeReservation}
            hoursUntilPickup={hoursUntilPickup}
            daysUntilPickup={daysUntilPickup}
          />
        )}

        {/* ── §3 Document Status ──────────────────────────── */}
        {activeReservation && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white border border-slate-200 rounded-2xl p-5 mb-5 shadow-sm"
          >
            <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              Estado de documentos
            </h2>
            <div className="space-y-3">
              <DocumentRow
                icon={FileText}
                label="Pasaporte"
                status={activeReservation.documents.passport}
                reservationId={activeReservation.id}
              />
              <DocumentRow
                icon={CreditCard}
                label="Carnet de conducir"
                status={activeReservation.documents.license}
                reservationId={activeReservation.id}
              />
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-slate-500">
                  Progreso check-in
                </span>
                <span className="text-[11px] font-bold text-blue-600">
                  {[activeReservation.documents.passport, activeReservation.documents.license].filter(
                    (s) => s === "APPROVED"
                  ).length}
                  /2 verificados
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${
                      ([activeReservation.documents.passport, activeReservation.documents.license].filter(
                        (s) => s === "APPROVED"
                      ).length /
                        2) *
                      100
                    }%`,
                  }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full bg-blue-600 rounded-full"
                />
              </div>
            </div>

            {/* Check-in CTA if docs incomplete */}
            {(activeReservation.documents.passport !== "APPROVED" ||
              activeReservation.documents.license !== "APPROVED") && (
              <Link
                href={`/check-in?reservationId=${activeReservation.id}`}
                className="mt-4 w-full min-h-[44px] bg-blue-600 text-white font-bold text-sm rounded-xl
                           flex items-center justify-center gap-2
                           hover:bg-blue-700 active:scale-[0.98] transition-all"
              >
                <Upload className="w-4 h-4" />
                Completar check-in digital
              </Link>
            )}
          </motion.div>
        )}

        {/* ── §4 Quick Actions ────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-5"
        >
          <h2 className="text-sm font-bold text-slate-900 mb-3">Acciones rápidas</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <QuickAction
              icon={QrCode}
              label="Smart Ticket"
              description="Tu QR de recogida"
              href={
                activeReservation
                  ? `/smart-ticket?reservationId=${activeReservation.id}`
                  : "#"
              }
              color="blue"
              disabled={!activeReservation}
            />
            <QuickAction
              icon={Upload}
              label="Check-in"
              description="Subir documentos"
              href={
                activeReservation
                  ? `/check-in?reservationId=${activeReservation.id}`
                  : "#"
              }
              color="emerald"
              disabled={!activeReservation}
            />
            <QuickAction
              icon={MessageCircle}
              label="Chat interno"
              description="Escríbenos desde la app"
              href="/soporte/chat"
              color="blue"
            />
            <QuickAction
              icon={MessageCircle}
              label="WhatsApp"
              description="Mensaje directo"
              href={`https://wa.me/${OPERATOR_WHATSAPP}?text=${encodeURIComponent(
                "Hola, tengo una reserva y necesito ayuda"
              )}`}
              color="green"
              external
            />
            <QuickAction
              icon={Phone}
              label="Llamar"
              description="Habla con un agente"
              href={`tel:+${OPERATOR_WHATSAPP}`}
              color="violet"
              external
            />
            <QuickAction
              icon={Headphones}
              label="Centro soporte"
              description="FAQ y ayuda 24/7"
              href="/soporte"
              color="amber"
            />
          </div>
        </motion.div>

        {/* ── §5 Trip Info (if active reservation) ────────── */}
        {activeReservation && <TripInfoCard reservation={activeReservation} />}

        {/* ── §6 Past Reservations ────────────────────────── */}
        {pastReservations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-5"
          >
            <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              Historial de viajes
            </h2>
            <div className="space-y-3">
              {pastReservations.map((res, i) => (
                <PastReservationCard key={res.id} reservation={res} index={i} />
              ))}
            </div>
          </motion.div>
        )}

        {/* ── §7 New Booking CTA ──────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-center shadow-lg"
        >
          <Plane className="w-8 h-8 text-white/80 mx-auto mb-2" />
          <h3 className="text-lg font-bold text-white mb-1">¿Planeas otro viaje?</h3>
          <p className="text-sm text-blue-100 mb-4">
            Reserva tu próximo coche desde 65€/día con solo 10€ de señal.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-white text-blue-600 font-bold text-sm
                       px-6 py-3 rounded-full hover:bg-blue-50 active:scale-[0.98]
                       shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            Nueva reserva
          </Link>
        </motion.div>

        {/* ── §8 Member Stats Footer ──────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
        >
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-black text-slate-900">{MOCK_USER.totalTrips}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Viajes realizados</p>
            </div>
            <div>
              <p className="text-2xl font-black text-emerald-600">
                <span className="flex items-center justify-center gap-0.5">
                  <Star className="w-4 h-4 fill-emerald-600" />
                  4.9
                </span>
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Valoración</p>
            </div>
            <div>
              <p className="text-2xl font-black text-blue-600">VIP</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Desde {format(new Date(MOCK_USER.memberSince), "MMM yyyy", { locale: es })}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ══════════════════════════════════════════════════════════════

// ── Active Reservation Hero Card ─────────────────────────────

function ActiveReservationHero({
  reservation,
  hoursUntilPickup,
  daysUntilPickup,
}: {
  reservation: MockReservation;
  hoursUntilPickup: number | null;
  daysUntilPickup: number | null;
}) {
  const vehicle = MOCK_VEHICLES.find((v) => v.id === reservation.vehicleId);
  const config = STATUS_CONFIG[reservation.status];
  const StatusIcon = config.icon;
  const pickupFmt = format(new Date(reservation.pickupDate), "EEE d MMM · HH:mm", { locale: es });
  const returnFmt = format(new Date(reservation.returnDate), "EEE d MMM · HH:mm", { locale: es });
  const pickupPast = isPast(new Date(reservation.pickupDate));

  // Countdown label
  let countdownLabel = "";
  if (!pickupPast && hoursUntilPickup !== null && daysUntilPickup !== null) {
    if (daysUntilPickup >= 1) {
      countdownLabel = `en ${daysUntilPickup} día${daysUntilPickup > 1 ? "s" : ""}`;
    } else if (hoursUntilPickup >= 1) {
      countdownLabel = `en ${hoursUntilPickup}h`;
    } else {
      countdownLabel = "¡Hoy!";
    }
  } else if (pickupPast && reservation.status === "IN_PROGRESS") {
    countdownLabel = "En curso";
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
      className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm mb-5"
    >
      {/* Top bar with status + countdown */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase px-2.5 py-1 rounded-full ${config.bg} ${config.text}`}
        >
          <StatusIcon className="w-3 h-3" />
          {config.label}
        </span>
        {countdownLabel && (
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
            Recogida {countdownLabel}
          </span>
        )}
      </div>

      {/* Vehicle info + image */}
      <div className="px-5 pb-4">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-slate-900">
              {vehicle ? `${vehicle.brand} ${vehicle.model}` : "Vehículo"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">#{reservation.id}</p>

            {/* Dates */}
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <Plane className="w-3 h-3 text-blue-600" />
                </div>
                <span className="capitalize">{pickupFmt}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <MapPin className="w-3 h-3 text-slate-500" />
                </div>
                <span className="capitalize">{returnFmt}</span>
              </div>
            </div>
          </div>

          {/* Vehicle image */}
          {vehicle && (
            <div className="w-28 h-20 md:w-36 md:h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0 relative">
              <Image
                src={vehicle.imageUrl}
                alt={`${vehicle.brand} ${vehicle.model}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 112px, 144px"
              />
            </div>
          )}
        </div>
      </div>

      {/* Separator */}
      <div className="border-t border-slate-100" />

      {/* Price + location strip */}
      <div className="px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {PICKUP_LOCATION_LABELS[reservation.pickupLocation] ?? reservation.pickupLocation}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {reservation.totalDays} días
          </span>
        </div>
        <div className="text-right">
          <p className="text-lg font-black text-slate-900">{reservation.totalPriceEUR} €</p>
          <p className="text-[10px] text-slate-400">
            Señal pagada: {reservation.depositPaidEUR}€
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="border-t border-slate-100" />
      <div className="px-5 py-3 flex gap-2">
        <Link
          href={`/smart-ticket?reservationId=${reservation.id}`}
          className="flex-1 min-h-[44px] bg-blue-600 text-white font-bold text-xs rounded-xl
                     flex items-center justify-center gap-1.5
                     hover:bg-blue-700 active:scale-[0.98] transition-all shadow-sm"
        >
          <QrCode className="w-4 h-4" />
          Smart Ticket
        </Link>
        <Link
          href={`/check-in?reservationId=${reservation.id}`}
          className="flex-1 min-h-[44px] bg-slate-100 text-slate-700 font-bold text-xs rounded-xl
                     flex items-center justify-center gap-1.5
                     hover:bg-slate-200 active:scale-[0.98] transition-all"
        >
          <Upload className="w-4 h-4" />
          Check-in
        </Link>
        <a
          href={`https://wa.me/${OPERATOR_WHATSAPP}?text=${encodeURIComponent(
            `Hola, tengo la reserva ${reservation.id}. He aterrizado.`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-[44px] min-w-[44px] bg-emerald-50 text-emerald-600 rounded-xl
                     flex items-center justify-center
                     hover:bg-emerald-100 active:scale-[0.98] transition-all"
        >
          <MessageCircle className="w-4 h-4" />
        </a>
      </div>
    </motion.div>
  );
}

// ── Document Row ─────────────────────────────────────────────

function DocumentRow({
  icon: Icon,
  label,
  status,
  reservationId,
}: {
  icon: React.ElementType;
  label: string;
  status: DocumentStatus;
  reservationId: string;
}) {
  const cfg = DOC_STATUS_LABELS[status];

  return (
    <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
      <div className="flex items-center gap-2.5">
        <Icon className="w-4 h-4 text-slate-400" />
        <span className="text-sm font-semibold text-slate-900">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        {status === "APPROVED" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
        {status === "PENDING_REVIEW" && (
          <motion.span
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </motion.span>
        )}
        {status === "REJECTED" && (
          <span className="w-3.5 h-3.5 rounded-full bg-red-500 flex items-center justify-center text-white text-[8px] font-bold">
            !
          </span>
        )}
        <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
        {status === "REJECTED" && (
          <Link
            href={`/check-in?reservationId=${reservationId}&retry=true`}
            className="text-[10px] font-bold text-blue-600 underline ml-1"
          >
            Reintentar
          </Link>
        )}
      </div>
    </div>
  );
}

// ── Quick Action Card ────────────────────────────────────────

const COLOR_MAP: Record<string, { bg: string; icon: string; hover: string }> = {
  blue: { bg: "bg-blue-50", icon: "text-blue-600", hover: "hover:bg-blue-100" },
  emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", hover: "hover:bg-emerald-100" },
  green: { bg: "bg-green-50", icon: "text-green-600", hover: "hover:bg-green-100" },
  violet: { bg: "bg-violet-50", icon: "text-violet-600", hover: "hover:bg-violet-100" },
  amber: { bg: "bg-amber-50", icon: "text-amber-600", hover: "hover:bg-amber-100" },
  slate: { bg: "bg-slate-100", icon: "text-slate-600", hover: "hover:bg-slate-200" },
};

function QuickAction({
  icon: Icon,
  label,
  description,
  href,
  color,
  disabled = false,
  external = false,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  href: string;
  color: string;
  disabled?: boolean;
  external?: boolean;
  onClick?: () => void;
}) {
  const c = COLOR_MAP[color] ?? COLOR_MAP.slate;

  if (disabled) {
    return (
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 opacity-50 cursor-not-allowed">
        <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center mb-2`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
        <p className="text-sm font-bold text-slate-900">{label}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">{description}</p>
      </div>
    );
  }

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`block w-full text-left bg-white border border-slate-200 rounded-2xl p-4 shadow-sm ${c.hover}
                    active:scale-[0.98] transition-all`}
      >
        <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center mb-2`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
        <p className="text-sm font-bold text-slate-900">{label}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">{description}</p>
      </button>
    );
  }

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`block bg-white border border-slate-200 rounded-2xl p-4 shadow-sm ${c.hover}
                    active:scale-[0.98] transition-all`}
      >
        <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center mb-2`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
        <p className="text-sm font-bold text-slate-900">{label}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">{description}</p>
      </a>
    );
  }

  return (
    <Link
      href={href}
      className={`block bg-white border border-slate-200 rounded-2xl p-4 shadow-sm ${c.hover}
                  active:scale-[0.98] transition-all`}
    >
      <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center mb-2`}>
        <Icon className={`w-5 h-5 ${c.icon}`} />
      </div>
      <p className="text-sm font-bold text-slate-900">{label}</p>
      <p className="text-[11px] text-slate-400 mt-0.5">{description}</p>
    </Link>
  );
}

// ── Trip Info Card ───────────────────────────────────────────

function TripInfoCard({ reservation }: { reservation: MockReservation }) {
  const features = [
    reservation.includesJawaz && { icon: CreditCard, label: "Tag Jawaz autopista" },
    reservation.includesSIM && { icon: Wifi, label: "SIM 5GB datos" },
    reservation.includesInsurance && { icon: Shield, label: "Seguro todo riesgo" },
  ].filter(Boolean) as Array<{ icon: React.ElementType; label: string }>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="bg-white border border-slate-200 rounded-2xl p-5 mb-5 shadow-sm"
    >
      <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
        <Car className="w-4 h-4 text-blue-600" />
        Tu viaje incluye
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {features.map(({ icon: FIcon, label }) => (
          <div
            key={label}
            className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <FIcon className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-xs font-semibold text-slate-700">{label}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5">
        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
        <span className="text-xs font-semibold text-emerald-700">
          Recogida en{" "}
          {PICKUP_LOCATION_LABELS[reservation.pickupLocation] ?? reservation.pickupLocation} —
          nuestro operador te espera en la puerta
        </span>
      </div>
    </motion.div>
  );
}

// ── Past Reservation Card ────────────────────────────────────

function PastReservationCard({
  reservation,
  index,
}: {
  reservation: MockReservation;
  index: number;
}) {
  const vehicle = MOCK_VEHICLES.find((v) => v.id === reservation.vehicleId);
  const config = STATUS_CONFIG[reservation.status];
  const pickupFmt = format(new Date(reservation.pickupDate), "d MMM", { locale: es });
  const returnFmt = format(new Date(reservation.returnDate), "d MMM yyyy", { locale: es });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 + 0.3 }}
      className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4"
    >
      {/* Vehicle mini image */}
      {vehicle && (
        <div className="w-16 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0 relative">
          <Image
            src={vehicle.imageUrl}
            alt={`${vehicle.brand} ${vehicle.model}`}
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-bold text-slate-900 truncate">
            {vehicle ? `${vehicle.brand} ${vehicle.model}` : "Vehículo"}
          </p>
          <span
            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${config.bg} ${config.text}`}
          >
            {config.label}
          </span>
        </div>
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {pickupFmt} – {returnFmt}
        </p>
      </div>
      <p className="text-sm font-bold text-slate-900 shrink-0">{reservation.totalPriceEUR} €</p>
    </motion.div>
  );
}
