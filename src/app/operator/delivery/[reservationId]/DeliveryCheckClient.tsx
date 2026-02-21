"use client";

import { useCallback, useState } from "react";
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
import type { OperatorDelivery } from "@/types";
import { completeReservation } from "./actions";
import { PICKUP_LOCATION_LABELS } from "@/lib/constants";

interface Props {
  delivery: OperatorDelivery;
}

export default function DeliveryCheckClient({ delivery }: Props) {
  const [checklist, setChecklist] = useState({
    keys: false,
    sim: false,
    jawaz: false,
  });
  const [recording, setRecording] = useState(false);
  const [videoRecorded, setVideoRecorded] = useState(false);
  const [timer, setTimer] = useState(30);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);

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

  const handleConfirm = useCallback(async () => {
    setBusy(true);
    try {
      await completeReservation(delivery.id);
      setConfirmed(true);
      toast.success("¡Entrega confirmada! Cobro registrado.");
    } catch {
      toast.error("Error al confirmar la entrega. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  }, [delivery.id]);

  // ── Docs validation ────────────────────────────────────────

  const allDocsApproved = delivery.documents.every((d) => d.status === "APPROVED");
  const docSummary = allDocsApproved
    ? "Pasaporte ✓ · Carnet ✓"
    : delivery.documents
        .map((d) => `${d.type === "PASSPORT" ? "Pasaporte" : "Carnet"}: ${d.status}`)
        .join(" · ");

  // ── Confirmed state ────────────────────────────────────────

  if (confirmed) {
    return (
      <div className="max-w-lg mx-auto px-5 pt-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 12, delay: 0.1 }}
          >
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          </motion.div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Entrega completada</h2>
          <p className="text-sm text-slate-500 mb-1">
            {delivery.customerName} — {delivery.vehicle.brand} {delivery.vehicle.model}
          </p>
          <p className="text-2xl font-black text-emerald-600 mb-6">{delivery.balanceDueEUR} € cobrados</p>
          <Link
            href="/operator/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-500 transition-colors"
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
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-5"
      >
        <ArrowLeft className="w-4 h-4" />
        Dashboard
      </Link>

      {/* Validated header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 mb-5"
      >
        <ShieldCheck className="w-6 h-6 text-emerald-500 shrink-0" />
        <div>
          <p className="text-sm font-bold text-slate-900">Reserva validada</p>
          <p className="text-xs text-slate-500">#{delivery.id}</p>
        </div>
      </motion.div>

      {/* Customer + Vehicle info */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 mb-5 shadow-sm">
        <div className="grid grid-cols-2 gap-3">
          <InfoBlock label="Cliente" value={delivery.customerName ?? "—"} />
          <InfoBlock
            label="Vehículo"
            value={`${delivery.vehicle.brand} ${delivery.vehicle.model}`}
          />
          <InfoBlock label="Terminal" value={PICKUP_LOCATION_LABELS[delivery.pickupLocation]} />
          <InfoBlock label="Duración" value={`${delivery.totalDays} días`} />
        </div>
        <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
          <FileText
            className={`w-4 h-4 ${allDocsApproved ? "text-emerald-500" : "text-amber-500"}`}
          />
          <span
            className={`text-xs font-bold ${
              allDocsApproved ? "text-emerald-500" : "text-amber-500"
            }`}
          >
            {docSummary}
          </span>
        </div>
      </div>

      {/* Balance to collect */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center mb-5 shadow-sm">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
          Cobrar ahora
        </p>
        <p className="text-4xl font-black text-slate-900 tabular-nums">{delivery.balanceDueEUR} €</p>
        <p className="text-xs text-slate-400 mt-1">en efectivo o TPV</p>
      </div>

      {/* Checklist */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-5 shadow-sm">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
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
              ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
              : recording
                ? "bg-red-50 text-red-600 border border-red-200"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
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
        disabled={!allChecked || busy}
        className="w-full min-h-[56px] bg-emerald-500 text-white font-bold text-base rounded-full
                   flex items-center justify-center gap-2 hover:bg-emerald-600
                   disabled:opacity-40 disabled:cursor-not-allowed
                   shadow-[0_4px_20px_rgba(16,185,129,0.3)] active:scale-[0.98] transition-all"
      >
        {busy ? (
          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <CheckCircle2 className="w-5 h-5" />
        )}
        {busy ? "Confirmando..." : "Confirmar entrega y cobro"}
      </button>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-bold text-slate-900 mt-0.5">{value}</p>
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
        ${checked ? "bg-emerald-50 border border-emerald-200" : "bg-slate-50 border border-slate-200 hover:border-slate-300"}`}
    >
      <div
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors
          ${checked ? "bg-emerald-500 border-emerald-500" : "border-slate-300"}`}
      >
        {checked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
      </div>
      <Icon className={`w-4 h-4 shrink-0 ${checked ? "text-emerald-500" : "text-slate-400"}`} />
      <span className={`text-sm font-medium ${checked ? "text-slate-900" : "text-slate-600"}`}>
        {label}
      </span>
    </button>
  );
}
