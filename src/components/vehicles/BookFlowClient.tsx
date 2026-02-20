"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CreditCard,
  Lock,
  MapPin,
  ShieldCheck,
  User,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Vehicle } from "@/types";
import { useBookingStore } from "@/stores/useBookingStore";
import { DEPOSIT_AMOUNT_EUR, PICKUP_LOCATION_LABELS } from "@/lib/constants";
import PhoneInput from "@/components/ui/PhoneInput";

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
  const { pickupDate, returnDate, pickupLocation, totalDays, totalPriceEUR, setReservationId } =
    useBookingStore();

  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState(0);

  // Contact form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Payment mock
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [processing, setProcessing] = useState(false);

  const fmtDate = (ts: number | null) =>
    ts ? format(new Date(ts), "EEE d MMM · HH:mm", { locale: es }) : "—";

  const goNext = useCallback(() => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, 3) as Step);
  }, []);

  const goBack = useCallback(() => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 1) as Step);
  }, []);

  const handleSubmit = useCallback(async () => {
    setProcessing(true);
    // Simulate payment processing
    await new Promise((r) => setTimeout(r, 2200));
    // Generate reservation ID
    const id = "CMN-" + Date.now().toString(36).toUpperCase();
    setReservationId(id);
    router.push(`/booking/confirmed?id=${id}`);
  }, [router, setReservationId]);

  const contactValid = name.trim().length >= 2 && phone.replace(/[^\d]/g, "").length >= 8;
  const cardValid =
    cardNumber.replace(/\s/g, "").length >= 14 &&
    expiry.length >= 4 &&
    cvc.length >= 3;

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
                  {done ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
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
                <h2 className="text-lg font-bold text-brand-dark mb-4">Resumen de tu reserva</h2>

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
                    <p className="text-xs text-brand-muted">{vehicle.pricePerDay}€/día</p>
                  </div>
                </div>

                {/* Details */}
                <div className="rounded-xl bg-slate-50 border border-slate-100 divide-y divide-slate-100 mb-5 overflow-hidden">
                  <Row icon={MapPin} label="Terminal" value={PICKUP_LOCATION_LABELS[pickupLocation]} />
                  <Row icon={Calendar} label="Recogida" value={fmtDate(pickupDate)} />
                  <Row icon={Calendar} label="Devolución" value={fmtDate(returnDate)} />
                </div>

                {/* Price breakdown */}
                <div className="space-y-2 mb-5">
                  <PriceRow
                    label={`Alquiler${totalDays ? ` (${totalDays}d × ${vehicle.pricePerDay}€)` : ""}`}
                    value={totalPriceEUR ? `${totalPriceEUR}€` : `${vehicle.pricePerDay}€/día`}
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
                  onClick={goNext}
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
                <h2 className="text-lg font-bold text-brand-dark mb-1">Datos de contacto</h2>
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
                    onClick={goNext}
                    disabled={!contactValid}
                    className="flex-1 min-h-[50px] bg-brand-primary disabled:bg-slate-200 disabled:text-slate-400
                               text-white font-bold text-sm rounded-full
                               flex items-center justify-center gap-2
                               hover:bg-brand-primary-hover active:scale-[0.98]
                               shadow-[0_4px_20px_rgba(37,99,235,0.28)] transition-all"
                  >
                    Continuar
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ─── Step 3: Payment mock ─────────────────── */}
            {step === 3 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm">
                <h2 className="text-lg font-bold text-brand-dark mb-1">Pago seguro</h2>
                <p className="text-sm text-brand-muted mb-5">
                  Solo {DEPOSIT_AMOUNT_EUR}€ de señal. Resto al recoger el coche.
                </p>

                <DepositBadge />

                <div className="space-y-4 mt-5">
                  <Field
                    label="Número de tarjeta"
                    value={cardNumber}
                    onChange={(v) => {
                      const raw = v.replace(/\D/g, "").slice(0, 16);
                      const formatted = raw.replace(/(\d{4})(?=\d)/g, "$1 ");
                      setCardNumber(formatted);
                    }}
                    placeholder="4242 4242 4242 4242"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="Caducidad"
                      value={expiry}
                      onChange={(v) => {
                        const raw = v.replace(/\D/g, "").slice(0, 4);
                        setExpiry(raw.length > 2 ? `${raw.slice(0, 2)}/${raw.slice(2)}` : raw);
                      }}
                      placeholder="MM/AA"
                    />
                    <Field
                      label="CVC"
                      value={cvc}
                      onChange={(v) => setCvc(v.replace(/\D/g, "").slice(0, 4))}
                      placeholder="123"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-brand-muted mt-4">
                  <Lock className="w-3.5 h-3.5" />
                  Protegido con cifrado SSL 256-bit
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={goBack}
                    disabled={processing}
                    className="min-h-[50px] px-5 bg-slate-100 text-brand-dark font-semibold text-sm rounded-full hover:bg-slate-200 transition-colors disabled:opacity-50"
                  >
                    Atrás
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!cardValid || processing}
                    className="flex-1 min-h-[50px] bg-brand-primary disabled:bg-slate-200 disabled:text-slate-400
                               text-white font-bold text-sm rounded-full
                               flex items-center justify-center gap-2
                               hover:bg-brand-primary-hover active:scale-[0.98]
                               shadow-[0_4px_20px_rgba(37,99,235,0.28)] transition-all"
                  >
                    {processing ? (
                      <span className="flex items-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full"
                        />
                        Procesando…
                      </span>
                    ) : (
                      <>
                        Pagar {DEPOSIT_AMOUNT_EUR}€
                        <Lock className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
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
      <span className="ml-auto font-semibold text-brand-dark text-right">{value}</span>
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
      <span className={`font-semibold ${green ? "text-emerald-600" : "text-brand-dark"}`}>
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
      <label className="block text-xs font-semibold text-brand-dark mb-1.5">{label}</label>
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
