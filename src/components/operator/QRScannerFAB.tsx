"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, X, Search, Keyboard, Car, Calendar, UserCheck, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { apiFetch } from "@/lib/api";
import type { OperatorDelivery } from "@/types";

export default function QRScannerFAB() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* FAB Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        whileTap={{ scale: 0.92 }}
        className="fixed bottom-24 right-5 z-40 w-14 h-14 bg-blue-600 rounded-full shadow-lg
                   shadow-blue-600/30 flex items-center justify-center
                   hover:bg-blue-700 active:shadow-md transition-all"
        aria-label="Escanear QR"
      >
        <QrCode className="w-6 h-6 text-white" />
      </motion.button>

      {/* Scanner Bottom Sheet */}
      <AnimatePresence>
        {isOpen && <ScannerSheet onClose={() => setIsOpen(false)} />}
      </AnimatePresence>
    </>
  );
}

// ── Scanner Sheet ─────────────────────────────────────────────

function ScannerSheet({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [mode, setMode] = useState<"scan" | "manual">("scan");
  const [manualQuery, setManualQuery] = useState("");
  const [scanning, setScanning] = useState(true);
  const [searching, setSearching] = useState(false);
  const [scannedDelivery, setScannedDelivery] = useState<OperatorDelivery | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);

  // Simulate QR detection after tap — navigates to search page
  const handleSimulatedScan = useCallback(async () => {
    setScanning(false);
    toast("Modo demo: usa búsqueda manual para encontrar una reserva.");
    setTimeout(() => {
      onClose();
      setMode("manual");
    }, 800);
  }, [onClose]);

  const handleManualSearch = useCallback(async () => {
    const query = manualQuery.trim();
    if (!query) return;
    setSearching(true);
    try {
      const res = await apiFetch<{ data: OperatorDelivery[]; total: number }>(
        `/operator/search?q=${encodeURIComponent(query)}`,
        { auth: true }
      );
      const results = res.data ?? [];
      if (results.length > 0) {
        toast.success(`Encontrado — ${results[0].customerName}`);
        setScannedDelivery(results[0]);
      } else {
        toast.error("No se encontró ninguna reserva");
      }
    } catch {
      toast.error("Error al buscar");
    } finally {
      setSearching(false);
    }
  }, [manualQuery, onClose, router]);

  const handleCheckin = useCallback(async () => {
    if (!scannedDelivery) return;
    setCheckingIn(true);
    try {
      await apiFetch(`/operator/delivery/${scannedDelivery.id}/checkin`, {
        method: "PATCH",
        auth: true,
      });
      toast.success("Check-in confirmado");
      onClose();
      router.push(`/operator/delivery/${scannedDelivery.id}`);
    } catch {
      toast.error("Error al confirmar check-in");
    } finally {
      setCheckingIn(false);
    }
  }, [scannedDelivery, onClose, router]);

  if (scannedDelivery) {
    return (
      <ScannedDeliveryModal
        delivery={scannedDelivery}
        onClose={() => setScannedDelivery(null)}
        onCheckin={handleCheckin}
        checkingIn={checkingIn}
      />
    );
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 z-50"
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-slate-200 rounded-t-3xl max-w-lg mx-auto shadow-xl"
      >
        {/* Handle & close */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="px-5 pb-8 space-y-4">
          {/* Mode toggle */}
          <div className="flex bg-slate-100 rounded-xl p-1">
            <button
              onClick={() => setMode("scan")}
              className={`flex-1 min-h-[40px] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors
                ${mode === "scan" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
            >
              <QrCode className="w-3.5 h-3.5" />
              Escanear QR
            </button>
            <button
              onClick={() => setMode("manual")}
              className={`flex-1 min-h-[40px] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors
                ${mode === "manual" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              Búsqueda manual
            </button>
          </div>

          {mode === "scan" ? (
            <>
              {/* Camera viewfinder placeholder */}
              <div
                className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden flex items-center justify-center cursor-pointer"
                onClick={handleSimulatedScan}
              >
                {/* Simulated viewfinder frame */}
                <div className="absolute inset-8 border-2 border-white/20 rounded-xl" />

                {/* Corner markers */}
                <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-blue-600 rounded-tl-lg" />
                <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-blue-600 rounded-tr-lg" />
                <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-blue-600 rounded-bl-lg" />
                <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-blue-600 rounded-br-lg" />

                {/* Scanning line animation */}
                {scanning && (
                  <motion.div
                    className="absolute left-8 right-8 h-0.5 bg-blue-600/60"
                    animate={{ top: ["15%", "85%", "15%"] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                  />
                )}

                <div className="text-center z-10">
                  <QrCode className="w-12 h-12 text-white/30 mx-auto mb-2" />
                  <p className="text-xs text-white/50">
                    {scanning ? "Centra el QR del cliente" : "¡Código detectado!"}
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-500 text-center">
                Toca el visor para simular un escaneo
              </p>
            </>
          ) : (
            <>
              {/* Manual search */}
              <div className="space-y-3">
                <p className="text-sm text-slate-600 font-medium">
                  Busca por nombre del cliente o ID de reserva
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualQuery}
                    onChange={(e) => setManualQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
                    placeholder="Ahmed Benjelloun o CMN-2026-001"
                    className="flex-1 min-h-[48px] px-4 bg-slate-50 border border-slate-200 rounded-xl
                               text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
                  />
                  <button
                    onClick={handleManualSearch}
                    disabled={searching}
                    className="min-h-[48px] px-4 bg-blue-600 text-white rounded-xl font-bold text-sm
                               hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </>
  );
}
// ── Scan Result Modal (T7-5) ──────────────────────────────────

function ScannedDeliveryModal({
  delivery,
  onClose,
  onCheckin,
  checkingIn,
}: {
  delivery: OperatorDelivery;
  onClose: () => void;
  onCheckin: () => void;
  checkingIn: boolean;
}) {
  const pickupTs =
    typeof delivery.pickupDate === "string"
      ? new Date(delivery.pickupDate).getTime()
      : delivery.pickupDate;
  const returnTs =
    typeof delivery.returnDate === "string"
      ? new Date(delivery.returnDate).getTime()
      : delivery.returnDate;

  const fmtPickup = pickupTs ? format(new Date(pickupTs), "EEE d MMM · HH:mm", { locale: es }) : "—";
  const fmtReturn = returnTs ? format(new Date(returnTs), "EEE d MMM", { locale: es }) : "—";

  const allDocsOk  = delivery.documents?.every((d) => d.status === "APPROVED") ?? false;
  const hasRejected = delivery.documents?.some((d) => d.status === "REJECTED") ?? false;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 z-50"
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-slate-200 rounded-t-3xl max-w-lg mx-auto shadow-xl"
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="px-5 pb-8 space-y-4">
          {/* QR validated badge */}
          <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <p className="text-sm font-bold text-emerald-700">QR Válido — Reserva encontrada</p>
          </div>

          {/* Customer + vehicle */}
          <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
            <ScanRow icon={UserCheck} label="Cliente" value={delivery.customerName} />
            {delivery.vehicle && (
              <ScanRow icon={Car} label="Vehículo" value={`${delivery.vehicle.brand} ${delivery.vehicle.model}`} />
            )}
            <ScanRow icon={Calendar} label="Recogida" value={fmtPickup} />
            <ScanRow icon={Calendar} label="Devolución" value={fmtReturn} />
          </div>

          {/* Doc status */}
          <div className={`flex items-center gap-2.5 rounded-xl px-4 py-3 border
            ${hasRejected ? "bg-red-50 border-red-200" : allDocsOk ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}
          >
            {hasRejected
              ? <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              : allDocsOk
              ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              : <Clock className="w-4 h-4 text-amber-500 shrink-0" />
            }
            <p className={`text-sm font-semibold
              ${hasRejected ? "text-red-700" : allDocsOk ? "text-emerald-700" : "text-amber-700"}`}
            >
              {hasRejected
                ? "Documentos rechazados — requiere atención"
                : allDocsOk
                ? "Documentos aprobados"
                : "Documentos en revisión"}
            </p>
          </div>

          {/* Balance */}
          <div className="flex justify-between items-center bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            <span className="text-sm font-semibold text-slate-900">Balance a cobrar</span>
            <span className="text-xl font-black text-blue-600">{delivery.balanceDueEUR}€</span>
          </div>

          {/* Confirm check-in */}
          <button
            onClick={onCheckin}
            disabled={checkingIn || hasRejected}
            className="w-full min-h-[52px] bg-blue-600 text-white font-bold text-sm rounded-xl
                       flex items-center justify-center gap-2 hover:bg-blue-700
                       disabled:opacity-50 transition-all"
          >
            <UserCheck className="w-5 h-5" />
            {checkingIn ? "Confirmando..." : "Confirmar entrega"}
          </button>
        </div>
      </motion.div>
    </>
  );
}

function ScanRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Icon className="w-4 h-4 text-slate-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-slate-900 truncate">{value}</p>
      </div>
    </div>
  );
}