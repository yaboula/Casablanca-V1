"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, X, Search, Keyboard } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { MOCK_DELIVERIES } from "@/lib/mock-operator-data";

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

  // Simulate QR detection after 3 seconds
  const handleSimulatedScan = useCallback(() => {
    setScanning(false);
    const delivery = MOCK_DELIVERIES[0];
    toast.success(`QR válido — ${delivery.customerName}`);
    setTimeout(() => {
      onClose();
      router.push(`/operator/delivery/${delivery.id}`);
    }, 800);
  }, [onClose, router]);

  const handleManualSearch = useCallback(() => {
    const query = manualQuery.trim().toLowerCase();
    if (!query) return;

    const match = MOCK_DELIVERIES.find(
      (d) =>
        d.customerName?.toLowerCase().includes(query) ||
        d.id.toLowerCase().includes(query)
    );

    if (match) {
      toast.success(`Encontrado — ${match.customerName}`);
      onClose();
      router.push(`/operator/delivery/${match.id}`);
    } else {
      toast.error("No se encontró ninguna reserva");
    }
  }, [manualQuery, onClose, router]);

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
                    className="min-h-[48px] px-4 bg-blue-600 text-white rounded-xl font-bold text-sm
                               hover:bg-blue-700 transition-colors"
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
