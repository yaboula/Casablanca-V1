"use client";

import { useCallback, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Video,
  Key,
  Smartphone,
  CreditCard,
  ArrowLeft,
  ShieldCheck,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { MOCK_DELIVERIES } from "@/lib/mock-operator-data";
import { PICKUP_LOCATION_LABELS } from "@/lib/constants";

export default function DeliveryPage() {
  const params = useParams<{ reservationId: string }>();
  const router = useRouter();

  const delivery = MOCK_DELIVERIES.find((d) => d.id === params.reservationId);

  const [checklist, setChecklist] = useState({
    keys: false,
    sim: false,
    jawaz: false,
  });
  const [recording, setRecording] = useState(false);
  const [videoRecorded, setVideoRecorded] = useState(false);
  const [timer, setTimer] = useState(30);
  const [confirmed, setConfirmed] = useState(false);

  // ── Video recording simulation ─────────────────────────────

  const handleRecordVideo = useCallback(() => {
    setRecording(true);
    setTimer(30);
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setRecording(false);
          setVideoRecorded(true);
          toast.success("Vídeo guardado localmente. Subiendo en background...");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // ── Confirm delivery ───────────────────────────────────────

  const allChecked = checklist.keys && checklist.sim && checklist.jawaz;

  const handleConfirm = useCallback(() => {
    setConfirmed(true);
    toast.success("¡Entrega confirmada! Cobro registrado.");
  }, []);

  // ── Not found ──────────────────────────────────────────────

  if (!delivery) {
    return (
      <div className="max-w-lg mx-auto px-5 pt-12 text-center">
        <p className="text-white text-lg font-bold">Reserva no encontrada</p>
        <Link href="/operator/dashboard" className="text-brand-primary text-sm mt-2 inline-block">
          ← Volver al dashboard
        </Link>
      </div>
    );
  }

  // ── Confirmed state ────────────────────────────────────────

  if (confirmed) {
    return (
      <div className="max-w-lg mx-auto px-5 pt-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-8 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 12, delay: 0.1 }}
          >
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          </motion.div>
          <h2 className="text-xl font-bold text-white mb-2">Entrega completada</h2>
          <p className="text-sm text-slate-400 mb-1">
            {delivery.customerName} — {delivery.vehicle.brand} {delivery.vehicle.model}
          </p>
          <p className="text-2xl font-black text-emerald-400 mb-6">
            {delivery.balanceDueEUR} € cobrados
          </p>
          <Link
            href="/operator/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-primary hover:text-blue-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al dashboard
          </Link>
        </motion.div>
      </div>
    );
  }

  // ── Main delivery view ─────────────────────────────────────

  return (
    <div className="max-w-lg mx-auto px-5 pt-6 pb-8">
      {/* Back */}
      <Link
        href="/operator/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-5"
      >
        <ArrowLeft className="w-4 h-4" />
        Dashboard
      </Link>

      {/* Validated header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3 mb-5"
      >
        <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
        <div>
          <p className="text-sm font-bold text-white">Reserva validada</p>
          <p className="text-xs text-slate-400">#{delivery.id}</p>
        </div>
      </motion.div>

      {/* Customer + Vehicle info */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 mb-5">
        <div className="grid grid-cols-2 gap-3">
          <InfoBlock label="Cliente" value={delivery.customerName ?? "—"} />
          <InfoBlock
            label="Vehículo"
            value={`${delivery.vehicle.brand} ${delivery.vehicle.model}`}
          />
          <InfoBlock label="Terminal" value={PICKUP_LOCATION_LABELS[delivery.pickupLocation]} />
          <InfoBlock label="Duración" value={`${delivery.totalDays} días`} />
        </div>
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
          <FileText className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-emerald-400">Pasaporte ✓ · Carnet ✓</span>
        </div>
      </div>

      {/* Balance to collect */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center mb-5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
          Cobrar ahora
        </p>
        <p className="text-4xl font-black text-white tabular-nums">
          {delivery.balanceDueEUR} €
        </p>
        <p className="text-xs text-slate-500 mt-1">en efectivo o TPV</p>
      </div>

      {/* Checklist */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Checklist de entrega
        </p>
        <div className="space-y-2">
          <ChecklistItem
            icon={Key}
            label="Llaves entregadas"
            checked={checklist.keys}
            onChange={(v) => setChecklist((prev) => ({ ...prev, keys: v }))}
          />
          <ChecklistItem
            icon={Smartphone}
            label="SIM 5GB entregada"
            checked={checklist.sim}
            onChange={(v) => setChecklist((prev) => ({ ...prev, sim: v }))}
          />
          <ChecklistItem
            icon={CreditCard}
            label="Tag Jawaz activado"
            checked={checklist.jawaz}
            onChange={(v) => setChecklist((prev) => ({ ...prev, jawaz: v }))}
          />
        </div>
      </div>

      {/* Video recording */}
      <button
        onClick={handleRecordVideo}
        disabled={recording || videoRecorded}
        className={`w-full min-h-[50px] rounded-xl font-bold text-sm flex items-center justify-center gap-2 mb-4 transition-all
          ${
            videoRecorded
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
              : recording
                ? "bg-red-500/15 text-red-400 border border-red-500/20"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
          }`}
      >
        <Video className="w-4 h-4" />
        {videoRecorded
          ? "Vídeo guardado ✓"
          : recording
            ? `Grabando... ${timer}s`
            : "Grabar vídeo estado del coche (30s)"}
      </button>

      {/* Confirm button */}
      <button
        onClick={handleConfirm}
        disabled={!allChecked}
        className="w-full min-h-[56px] bg-emerald-500 text-white font-bold text-base rounded-full
                   flex items-center justify-center gap-2 hover:bg-emerald-600
                   disabled:opacity-40 disabled:cursor-not-allowed
                   shadow-[0_4px_20px_rgba(16,185,129,0.3)] active:scale-[0.98] transition-all"
      >
        <CheckCircle2 className="w-5 h-5" />
        Confirmar entrega y cobro
      </button>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-bold text-white mt-0.5">{value}</p>
    </div>
  );
}

function ChecklistItem({
  icon: Icon,
  label,
  checked,
  onChange,
}: {
  icon: React.ElementType;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-full flex items-center gap-3 min-h-[48px] px-3 rounded-xl transition-colors
        ${checked ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-slate-800 border border-slate-700 hover:border-slate-600"}`}
    >
      <div
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors
          ${checked ? "bg-emerald-500 border-emerald-500" : "border-slate-600"}`}
      >
        {checked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
      </div>
      <Icon className={`w-4 h-4 shrink-0 ${checked ? "text-emerald-400" : "text-slate-400"}`} />
      <span className={`text-sm font-medium ${checked ? "text-white" : "text-slate-300"}`}>
        {label}
      </span>
    </button>
  );
}
