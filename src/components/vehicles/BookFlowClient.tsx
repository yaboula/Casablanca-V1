"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CreditCard,
  MapPin,
  ShieldCheck,
  User,
} from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import type { Vehicle } from "@/types";
import { useBookingStore } from "@/stores/useBookingStore";
import { DEPOSIT_AMOUNT_EUR, PICKUP_LOCATION_LABELS } from "@/lib/constants";
import PhoneInput from "@/components/ui/PhoneInput";
import { apiFetch, NexusApiError } from "@/lib/api";
import StripeProvider from "@/components/shared/StripeProvider";
import PaymentStep from "@/components/vehicles/PaymentStep";
import { readUserCookie } from "@/hooks/useUser";

// ── Steps ─────────────────────────────────────────────────────

type Step = 1 | 2 | 3;
const STEP_LABELS: Record<Step, string> = {
  1: "Resumen",
  2: "Contacto",
  3: "Pago",
};
const STEP_ICONS: Record<Step, React.ElementType> = {
  1: Calendar,
  2: User,
  3: CreditCard,
};

// ── Variants ──────────────────────────────────────────────────

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({
    x: dir > 0 ? -60 : 60,
    opacity: 0,
  }),
};

// ── Component ─────────────────────────────────────────────────

export default function BookFlowClient({ vehicle }: { vehicle: Vehicle }) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    pickupDate,
    returnDate,
    pickupLocation,
    totalDays,
    totalPriceEUR,
    setReservationId,
  } = useBookingStore();

  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState(0);

  // Contact form — pre-filled from session cookie if available
  const [name, setName] = useState(() => readUserCookie()?.fullName ?? "");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(() => readUserCookie()?.email ?? "");

  // Payment state (real)
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [serverReservationId, setServerReservationId] = useState<string | null>(
    null,
  );

  // T3-0 — Guard: redirect if dates are missing (shared link / expired store)
  useEffect(() => {
    const isValidDate = (d: unknown) =>
      (typeof d === "number" || typeof d === "string") &&
      !isNaN(new Date(d as number).getTime());
    const state = useBookingStore.getState();
    if (!isValidDate(state.pickupDate) || !isValidDate(state.returnDate)) {
      router.replace("/catalog?error=select-dates");
    }
  }, [router]);

  const CASABLANCA_TZ = "Africa/Casablanca";
  const fmtDate = (ts: number | null) =>
    ts
      ? formatInTimeZone(new Date(ts), CASABLANCA_TZ, "EEE d MMM · HH:mm", {
          locale: es,
        })
      : "—";

  const goNext = useCallback(() => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, 3) as Step);
  }, []);

  const goBack = useCallback(() => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 1) as Step);
  }, []);

  // Step 1 → Step 2: require login first
  const handleStep1Next = useCallback(() => {
    const user = readUserCookie();
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    goNext();
  }, [router, pathname, goNext]);

  // Validity checks — declared before handleContactNext so closure captures correctly
  const contactValid =
    name.trim().length >= 2 && phone.replace(/[^\d]/g, "").length >= 8;

  const bypassPayment = process.env.NEXT_PUBLIC_BYPASS_PAYMENT === "true";

  // T3-3 — Step 2 → Step 3: create reservation in backend
  const handleContactNext = useCallback(async () => {
    if (!contactValid || processing) return;
    setProcessing(true);
    try {
      const payload = {
        vehicleId: vehicle.id,
        pickupDate: new Date(pickupDate!).toISOString(),
        returnDate: new Date(returnDate!).toISOString(),
        pickupLocation,
        customerName: name.trim(),
        customerPhone: phone,
        // DEV bypass: send price so the route doesn't need to query the DB
        pricePerDayCents: Math.round(vehicle.pricePerDay * 100),
      };

      if (bypassPayment) {
        // DEV: skip NestJS + Stripe — insert directly into DB as CONFIRMED
        const devRes = await fetch("/api/dev/book-bypass", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!devRes.ok) {
          const err = await devRes.json().catch(() => ({}));
          throw new Error(err.detail ?? err.error ?? "Dev bypass failed");
        }
        const { id } = await devRes.json();
        setReservationId(id);
        router.push(`/booking/confirmed?id=${id}`);
        return;
      }

      // Normal flow: create via NestJS (Stripe PaymentIntent inside)
      const res = await apiFetch<{
        id: string;
        stripeClientSecret: string;
        totalPriceEurCents: number;
      }>("/reservations", {
        method: "POST",
        auth: true,
        body: JSON.stringify(payload),
      });
      setClientSecret(res.stripeClientSecret);
      setServerReservationId(res.id);
      goNext();
    } catch (err) {
      if (err instanceof NexusApiError && err.statusCode === 409) {
        toast.error("Este vehículo ya no está disponible para esas fechas.");
      } else {
        console.error("[BookFlowClient] reservation error:", err);
        toast.error("No se pudo iniciar la reserva. Inténtalo de nuevo.");
      }
    } finally {
      setProcessing(false);
    }
  }, [
    contactValid,
    processing,
    vehicle.id,
    pickupDate,
    returnDate,
    pickupLocation,
    name,
    phone,
    bypassPayment,
    goNext,
    router,
    setReservationId,
  ]);

  // T3-5 — Post-payment success
  function handlePaymentSuccess() {
    setReservationId(serverReservationId!);
    router.push(`/booking/confirmed?id=${serverReservationId}`);
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 md:px-8 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            href={`/catalog/${vehicle.id}`}
            className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-dark transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Volver al coche</span>
          </Link>
          <span className="text-sm font-bold text-brand-dark">
            {vehicle.brand} {vehicle.model}
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {([1, 2, 3] as Step[]).map((s) => {
            const Icon = STEP_ICONS[s];
            const active = s === step;
            const done = s < step;
            return (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors
                    ${done ? "bg-brand-success text-white" : active ? "bg-brand-primary text-white" : "bg-slate-100 text-brand-muted"}`}
                >
                  {done ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                </div>
                <span
                  className={`text-xs font-semibold transition-colors hidden sm:inline
                    ${active ? "text-brand-dark" : "text-brand-muted"}`}
                >
                  {STEP_LABELS[s]}
                </span>
                {s < 3 && <div className="w-8 h-px bg-slate-200 mx-1" />}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* ─── Step 1: Summary ──────────────────────── */}
            {step === 1 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm">
                <h2 className="text-lg font-bold text-brand-dark mb-4">
                  Resumen de tu reserva
                </h2>

                {/* Vehicle mini-card */}
                <div className="flex items-center gap-4 bg-slate-50 rounded-xl p-3 mb-5">
                  <div className="relative w-20 h-14 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                    <Image
                      src={vehicle.imageUrl}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "/images/vehicles/placeholder.svg";
                      }}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-brand-dark">
                      {vehicle.brand} {vehicle.model}
                    </p>
                    <p className="text-xs text-brand-muted">
                      {vehicle.pricePerDay}€/día
                    </p>
                  </div>
                </div>

                {/* Details */}
                <div className="rounded-xl bg-slate-50 border border-slate-100 divide-y divide-slate-100 mb-5 overflow-hidden">
                  <Row
                    icon={MapPin}
                    label="Terminal"
                    value={PICKUP_LOCATION_LABELS[pickupLocation]}
                  />
                  <Row
                    icon={Calendar}
                    label="Recogida"
                    value={fmtDate(pickupDate)}
                  />
                  <Row
                    icon={Calendar}
                    label="Devolución"
                    value={fmtDate(returnDate)}
                  />
                </div>

                {/* Price breakdown */}
                <div className="space-y-2 mb-5">
                  <PriceRow
                    label={`Alquiler${totalDays ? ` (${totalDays}d × ${vehicle.pricePerDay}€)` : ""}`}
                    value={
                      totalPriceEUR
                        ? `${totalPriceEUR}€`
                        : `${vehicle.pricePerDay}€/día`
                    }
                  />
                  <PriceRow label="Seguro Todo Riesgo" value="Incluido" green />
                  <PriceRow label="Tag Jawaz" value="Incluido" green />
                  <div className="h-px bg-slate-200" />
                  <div className="flex justify-between text-sm pt-1">
                    <span className="font-bold text-brand-dark">Total</span>
                    <span className="font-black text-brand-dark text-lg">
                      {totalPriceEUR ?? "—"}€
                    </span>
                  </div>
                </div>

                <DepositBadge />

                <button
                  type="button"
                  onClick={handleStep1Next}
                  className="w-full mt-5 min-h-[50px] bg-brand-primary text-white font-bold text-sm rounded-full
                             flex items-center justify-center gap-2
                             hover:bg-brand-primary-hover active:scale-[0.98]
                             shadow-[0_4px_20px_rgba(37,99,235,0.28)] transition-all"
                >
                  Continuar
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* ─── Step 2: Contact ──────────────────────── */}
            {step === 2 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm">
                <h2 className="text-lg font-bold text-brand-dark mb-1">
                  Datos de contacto
                </h2>
                <p className="text-sm text-brand-muted mb-5">
                  Te enviaremos la confirmación por WhatsApp y email.
                </p>

                <div className="space-y-4">
                  <Field
                    label="Nombre completo"
                    value={name}
                    onChange={setName}
                    placeholder="Ej: Ahmed El Fassi"
                    autoFocus
                  />
                  <PhoneInput
                    value={phone}
                    onChange={setPhone}
                    label="Teléfono / WhatsApp"
                    placeholder="6XX XX XX XX"
                  />
                  <Field
                    label="Email (opcional)"
                    value={email}
                    onChange={setEmail}
                    placeholder="tu@email.com"
                    type="email"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={goBack}
                    className="min-h-[50px] px-5 bg-slate-100 text-brand-dark font-semibold text-sm rounded-full hover:bg-slate-200 transition-colors"
                  >
                    Atrás
                  </button>
                  <button
                    type="button"
                    onClick={handleContactNext}
                    disabled={!contactValid || processing}
                    className="flex-1 min-h-[50px] bg-brand-primary disabled:bg-slate-200 disabled:text-slate-400
                               text-white font-bold text-sm rounded-full
                               flex items-center justify-center gap-2
                               hover:bg-brand-primary-hover active:scale-[0.98]
                               shadow-[0_4px_20px_rgba(37,99,235,0.28)] transition-all"
                  >
                    {processing ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            repeat: Infinity,
                            duration: 1,
                            ease: "linear",
                          }}
                          className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full"
                        />
                        Iniciando reserva…
                      </>
                    ) : (
                      <>
                        Continuar al pago
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ─── Step 3: Payment (Stripe) ─────────────── */}
            {step === 3 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm">
                <h2 className="text-lg font-bold text-brand-dark mb-1">
                  Pago seguro
                </h2>
                <p className="text-sm text-brand-muted mb-5">
                  Solo {DEPOSIT_AMOUNT_EUR}€ de señal. Resto al recoger el
                  coche.
                </p>

                {clientSecret ? (
                  <StripeProvider clientSecret={clientSecret}>
                    <PaymentStep
                      reservationId={serverReservationId!}
                      onSuccess={handlePaymentSuccess}
                      onBack={goBack}
                    />
                  </StripeProvider>
                ) : (
                  /* Fallback while clientSecret is being set (should be near-instant) */
                  <div className="flex items-center justify-center py-12">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        repeat: Infinity,
                        duration: 1,
                        ease: "linear",
                      }}
                      className="w-6 h-6 border-2 border-brand-primary/30 border-t-brand-primary rounded-full"
                    />
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────

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
    <div className="flex items-center gap-3 px-4 py-2.5 text-sm">
      <Icon className="w-3.5 h-3.5 text-brand-muted shrink-0" />
      <span className="text-brand-muted">{label}</span>
      <span className="ml-auto font-semibold text-brand-dark text-right">
        {value}
      </span>
    </div>
  );
}

function PriceRow({
  label,
  value,
  green,
}: {
  label: string;
  value: string;
  green?: boolean;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-brand-muted">{label}</span>
      <span
        className={`font-semibold ${green ? "text-emerald-600" : "text-brand-dark"}`}
      >
        {value}
      </span>
    </div>
  );
}

function DepositBadge() {
  return (
    <div className="flex items-start gap-3 bg-brand-primary/5 border border-brand-primary/15 rounded-xl p-3.5">
      <div className="w-7 h-7 rounded-lg bg-brand-primary flex items-center justify-center shrink-0">
        <ShieldCheck className="w-3.5 h-3.5 text-white" />
      </div>
      <div>
        <p className="text-sm font-bold text-brand-dark">
          Solo pagas ahora: {DEPOSIT_AMOUNT_EUR}€
        </p>
        <p className="text-xs text-brand-muted mt-0.5">
          Cancelación gratuita hasta 48h antes de la recogida.
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-brand-dark mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full h-11 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl
                   text-brand-dark placeholder:text-brand-muted/50
                   focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary
                   transition-all"
      />
    </div>
  );
}
