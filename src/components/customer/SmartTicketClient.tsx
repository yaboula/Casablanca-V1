"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Clock,
  Copy,
  MessageCircle,
  Sparkles,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es as esLocale, fr as frLocale } from "date-fns/locale";
import { enUS as enUSLocale } from "date-fns/locale";
import { toast } from "sonner";
import { useBookingStore, useCurrencyStore } from "@/stores/useBookingStore";
import { apiFetch } from "@/lib/api";
import {
  DEPOSIT_AMOUNT_EUR,
  OPERATOR_PHONE,
  PICKUP_LOCATION_LABELS,
} from "@/lib/constants";
import { generateQRCodeSVG } from "@/lib/qr";
import { useTranslations, useLocaleStore } from "@/lib/i18n";

// ── Types ─────────────────────────────────────────────

interface ReservationData {
  id: string;
  qrCodeHash?: string;
  vehicle?: { brand: string; model: string };
  pickupDate?: string | number;
  returnDate?: string | number;
  pickupLocation?: string;
  totalDays?: number;
  balanceDueEUR?: number;
}

// ── Component ─────────────────────────────────────────────────

interface Props {
  reservationId: string;
}

export default function SmartTicketClient({ reservationId }: Props) {
  const tSmartTicket = useTranslations("smartTicket");
  const { locale } = useLocaleStore();
  const dateFnsLocale =
    locale === "fr" ? frLocale : locale === "en" ? enUSLocale : esLocale;
  const {
    pickupDate: storePickupDate,
    returnDate: storeReturnDate,
    pickupLocation: storePickupLocation,
    totalDays: storeTotalDays,
    totalPriceEUR,
  } = useBookingStore();

  const { currency, madRate } = useCurrencyStore();

  // ── Fetch real reservation data ─────────────────────────────
  const [resv, setResv] = useState<ReservationData | null>(null);

  useEffect(() => {
    if (!reservationId || reservationId === "CMN-2026-001") return;
    // BUG-17 fix: Backend returns { data: ReservationData }, unwrap it
    apiFetch<{ data: ReservationData }>(`/reservations/${reservationId}`, {
      auth: true,
    })
      .then((raw) => setResv(raw.data))
      .catch(() => {}); // falls back to booking store data
  }, [reservationId]);

  // Resolved display values — API takes priority over booking store
  const toTs = (d: string | number | undefined): number | undefined =>
    d === undefined
      ? undefined
      : typeof d === "string"
        ? new Date(d).getTime()
        : d;

  const vehicleBrand = resv?.vehicle?.brand ?? "Vehículo";
  const vehicleModel = resv?.vehicle?.model ?? "";
  const pickupDate = toTs(resv?.pickupDate) ?? storePickupDate;
  const returnDate = toTs(resv?.returnDate) ?? storeReturnDate;
  const pickupLocation = resv?.pickupLocation ?? storePickupLocation;
  const totalDays = resv?.totalDays ?? storeTotalDays;
  const balanceDueEUR =
    resv?.balanceDueEUR ??
    (totalPriceEUR ? totalPriceEUR - DEPOSIT_AMOUNT_EUR : 0);
  const balanceDue =
    currency === "MAD" ? Math.round(balanceDueEUR * madRate) : balanceDueEUR;
  const balanceLabel =
    currency === "MAD" ? `${balanceDue} DH` : `${balanceDue}€`;

  // ── QR Code ────────────────────────────────────────────────

  const [qrSvg, setQrSvg] = useState<string>("");

  useEffect(() => {
    const hash = resv?.qrCodeHash ?? `NEXUS-${reservationId}-${Date.now()}`;
    generateQRCodeSVG(hash).then(setQrSvg);
  }, [reservationId, resv?.qrCodeHash]);

  // ── Countdown ──────────────────────────────────────────────

  const [countdown, setCountdown] = useState("");
  const [isNow, setIsNow] = useState(false);

  useEffect(() => {
    function tick() {
      if (!pickupDate) {
        setCountdown("—");
        return;
      }
      const diff = pickupDate - Date.now();
      if (diff <= 0) {
        setCountdown(tSmartTicket.now);
        setIsNow(true);
        return;
      }
      const hours = Math.floor(diff / 3_600_000);
      const mins = Math.floor((diff % 3_600_000) / 60_000);
      if (hours > 0) {
        setCountdown(`${hours}h ${mins}min`);
      } else {
        setCountdown(`En ${mins}min`);
      }
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [pickupDate]);

  // ── Dates formatted ────────────────────────────────────────

  const fmtPickup = pickupDate
    ? format(new Date(pickupDate), "EEE d MMM · HH:mm", {
        locale: dateFnsLocale,
      })
    : "—";
  const fmtReturn = returnDate
    ? format(new Date(returnDate), "EEE d MMM", { locale: dateFnsLocale })
    : "—";

  // ── WhatsApp ───────────────────────────────────────────────

  const whatsappUrl = useMemo(() => {
    const msg = encodeURIComponent(
      tSmartTicket.whatsappMsg
        .replace("{id}", reservationId)
        .replace("{brand}", vehicleBrand)
        .replace("{model}", vehicleModel),
    );
    return `https://wa.me/${OPERATOR_PHONE}?text=${msg}`;
  }, [reservationId, tSmartTicket.whatsappMsg, vehicleBrand, vehicleModel]);

  const handleWallet = useCallback(() => {
    toast.info(tSmartTicket.walletSoon);
  }, [tSmartTicket.walletSoon]);

  // ── Copy reservation ID ───────────────────────────────────
  const [copied, setCopied] = useState(false);
  const handleCopyId = useCallback(() => {
    navigator.clipboard.writeText(reservationId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [reservationId]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center py-8 md:py-12 px-4">
      {/* ── Boarding Pass Card ──────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden relative"
      >
        {/* Ambient gradient */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, rgba(37,99,235,0.04) 0%, rgba(16,185,129,0.04) 50%, rgba(37,99,235,0.04) 100%)",
            backgroundSize: "200% 200%",
          }}
          animate={{ backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />

        {/* Header */}
        <div className="relative bg-brand-dark px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white font-black text-base tracking-tight">
              NEXUS
            </span>
            <span className="text-brand-primary font-black text-base">.</span>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-500/20 px-2.5 py-1 rounded-full">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
              {tSmartTicket.passApproved}
            </span>
          </div>
        </div>

        {/* Passenger & Vehicle info */}
        <div className="px-5 py-4 grid grid-cols-2 gap-4 border-b border-slate-100">
          <InfoBlock
            label={tSmartTicket.passenger}
            value={tSmartTicket.clientLabel}
          />
          <InfoBlock
            label={tSmartTicket.vehicle}
            value={`${vehicleBrand} ${vehicleModel}`.trim()}
          />
          <InfoBlock label={tSmartTicket.pickup} value={fmtPickup} />
          <InfoBlock label={tSmartTicket.return} value={fmtReturn} />
          <InfoBlock
            label={tSmartTicket.terminal}
            value={PICKUP_LOCATION_LABELS[pickupLocation]}
          />
          <InfoBlock
            label={tSmartTicket.duration}
            value={
              totalDays
                ? `${totalDays} ${totalDays === 1 ? tSmartTicket.day : tSmartTicket.days}`
                : "—"
            }
          />
        </div>

        {/* Perforation separator */}
        <Perforation />

        {/* QR Code */}
        <div className="px-5 py-4 flex flex-col items-center">
          <div
            className="w-48 h-48 flex items-center justify-center"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
          <p className="text-xs text-brand-muted mt-3 font-medium">
            {tSmartTicket.showQR}
          </p>
          {/* Reservation ID with copy button */}
          <button
            type="button"
            onClick={handleCopyId}
            className="mt-3 flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-50
                       border border-slate-200 hover:border-brand-primary/40 transition-colors group"
          >
            <span className="text-[11px] font-mono font-semibold text-brand-muted group-hover:text-brand-dark">
              #{reservationId}
            </span>
            <AnimatePresence mode="wait" initial={false}>
              {copied ? (
                <motion.span
                  key="check"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Check className="w-3 h-3 text-brand-success" />
                </motion.span>
              ) : (
                <motion.span
                  key="copy"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Copy className="w-3 h-3 text-brand-muted" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        <Perforation />

        {/* Balance & Countdown */}
        <div className="px-5 py-4 space-y-4">
          <div className="flex justify-between items-center bg-brand-primary/5 border border-brand-primary/15 rounded-xl px-4 py-3">
            <span className="text-sm font-semibold text-brand-dark">
              {tSmartTicket.balanceDue}
            </span>
            <span className="text-xl font-black text-brand-primary">
              {balanceLabel}
            </span>
          </div>

          <div
            className={`flex items-center justify-between rounded-xl px-4 py-3 border transition-colors
              ${isNow ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-100"}`}
          >
            <div className="flex items-center gap-2">
              <Clock
                className={`w-4 h-4 ${isNow ? "text-brand-success" : "text-brand-muted"}`}
              />
              <span className="text-sm font-semibold text-brand-dark">
                {isNow
                  ? tSmartTicket.operatorWaiting
                  : tSmartTicket.timeToPickup}
              </span>
            </div>
            {pickupDate ? (
              <motion.span
                key={countdown}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-base font-black ${isNow ? "text-brand-success" : "text-brand-dark"}`}
              >
                {countdown}
              </motion.span>
            ) : (
              <Link
                href="/catalog"
                className="text-xs font-bold text-brand-primary hover:underline"
              >
                {tSmartTicket.completarReserva}
              </Link>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 space-y-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full min-h-[50px] bg-[#25D366] text-white font-bold text-sm rounded-full
                       flex items-center justify-center gap-2 hover:bg-[#1DA851]
                       shadow-[0_4px_16px_rgba(37,211,102,0.25)] transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            {tSmartTicket.whatsappLanded}
          </a>

          <button
            type="button"
            onClick={handleWallet}
            className="w-full min-h-[48px] bg-brand-dark text-white font-bold text-sm rounded-full
                       flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
          >
            <Wallet className="w-4 h-4" />
            {tSmartTicket.addWallet}
          </button>
        </div>
      </motion.div>

      <Link
        href="/"
        className="text-sm text-brand-muted hover:text-brand-dark mt-6 transition-colors"
      >
        {tSmartTicket.backToHome}
      </Link>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-brand-muted uppercase tracking-wider">
        {label}
      </p>
      <p className="text-sm font-bold text-brand-dark mt-0.5">{value}</p>
    </div>
  );
}

function Perforation() {
  return (
    <div className="relative h-6">
      <div className="absolute inset-y-0 left-0 w-3 -translate-x-1/2 bg-slate-100 rounded-r-full" />
      <div className="absolute inset-y-0 right-0 w-3 translate-x-1/2 bg-slate-100 rounded-l-full" />
      <div className="absolute inset-x-4 top-1/2 border-t-2 border-dashed border-slate-200" />
    </div>
  );
}
