"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { CheckCircle2, X, FileText, CreditCard, Clock } from "lucide-react";
import { toast } from "sonner";
import { MOCK_PENDING_DOCS } from "@/lib/mock-operator-data";

// ── Rejection reasons ────────────────────────────────────────

const REJECTION_REASONS = [
  "Imagen borrosa o mal enfocada",
  "Documento caducado",
  "Documento incompleto (falta página)",
  "Nombre no coincide con la reserva",
];

// ── Component ────────────────────────────────────────────────

export default function DocumentsPage() {
  const [docs, setDocs] = useState(MOCK_PENDING_DOCS);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [customReason, setCustomReason] = useState("");

  const currentDoc = docs[currentIdx];
  const remaining = docs.length - currentIdx;

  const goNext = useCallback(() => {
    setCurrentIdx((prev) => prev + 1);
    setShowRejectModal(false);
    setCustomReason("");
  }, []);

  const handleApprove = useCallback(() => {
    if (!currentDoc) return;
    toast.success(`${currentDoc.customerName} — ${currentDoc.type === "PASSPORT" ? "Pasaporte" : "Carnet"} aprobado`);
    goNext();
  }, [currentDoc, goNext]);

  const handleReject = useCallback(
    (reason: string) => {
      if (!currentDoc) return;
      toast.error(`Rechazado: ${reason}`);
      goNext();
    },
    [currentDoc, goNext]
  );

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      if (info.offset.x > 120 || info.velocity.x > 500) {
        handleApprove();
      } else if (info.offset.x < -120 || info.velocity.x < -500) {
        setShowRejectModal(true);
      }
    },
    [handleApprove]
  );

  // ── Empty state ────────────────────────────────────────────

  if (!currentDoc || currentIdx >= docs.length) {
    return (
      <div className="max-w-lg mx-auto px-5 pt-12 text-center">
        <div className="w-16 h-16 mx-auto bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Todo revisado</h1>
        <p className="text-sm text-slate-500">
          No hay documentos pendientes de revisión.
        </p>
      </div>
    );
  }

  // ── Main view ──────────────────────────────────────────────

  return (
    <div className="max-w-lg mx-auto px-5 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Documentos</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {remaining} pendiente{remaining !== 1 ? "s" : ""} de revisión
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-full">
          <Clock className="w-3 h-3 text-amber-500" />
          <span className="text-[10px] font-bold text-amber-500">{remaining}</span>
        </div>
      </div>

      {/* Swipe instructions */}
      <div className="flex items-center justify-between text-xs text-slate-500 mb-3 px-2">
        <span className="flex items-center gap-1">
          <X className="w-3 h-3 text-red-400" />
          ← Rechazar
        </span>
        <span className="flex items-center gap-1">
          Aprobar →
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
        </span>
      </div>

      {/* Card stack */}
      <div className="relative h-[480px]">
        <AnimatePresence mode="popLayout">
          <DocumentReviewCard
            key={currentDoc.id}
            doc={currentDoc}
            onDragEnd={handleDragEnd}
            onApprove={handleApprove}
            onReject={() => setShowRejectModal(true)}
          />
        </AnimatePresence>
      </div>

      {/* Reject modal (bottom sheet) */}
      <AnimatePresence>
        {showRejectModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => setShowRejectModal(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-slate-200 rounded-t-3xl p-5 pb-8 max-w-lg mx-auto shadow-xl"
            >
              <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-5" />
              <h3 className="text-base font-bold text-slate-900 mb-4">
                Motivo del rechazo
              </h3>
              <div className="space-y-2 mb-4">
                {REJECTION_REASONS.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => handleReject(reason)}
                    className="w-full min-h-[48px] text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200
                               rounded-xl text-sm text-slate-900 font-medium transition-colors"
                  >
                    {reason}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Otro motivo..."
                  className="flex-1 min-h-[48px] px-4 bg-slate-50 border border-slate-200 rounded-xl
                             text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
                />
                <button
                  onClick={() => customReason.trim() && handleReject(customReason.trim())}
                  disabled={!customReason.trim()}
                  className="min-h-[48px] px-4 bg-red-500 text-white rounded-xl text-sm font-bold
                             hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Enviar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Swipeable Document Card ──────────────────────────────────

interface DocCardProps {
  doc: (typeof MOCK_PENDING_DOCS)[number];
  onDragEnd: (event: unknown, info: PanInfo) => void;
  onApprove: () => void;
  onReject: () => void;
}

function DocumentReviewCard({ doc, onDragEnd, onApprove, onReject }: DocCardProps) {
  const TypeIcon = doc.type === "PASSPORT" ? FileText : CreditCard;
  const typeLabel = doc.type === "PASSPORT" ? "Pasaporte" : "Carnet de Conducir";

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={onDragEnd}
      initial={{ opacity: 0, scale: 0.95, x: 0 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.9, x: 400 }}
      transition={{ type: "spring", damping: 20, stiffness: 200 }}
      whileDrag={{ cursor: "grabbing" }}
      className="absolute inset-0 bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col touch-pan-y shadow-lg"
      style={{ touchAction: "pan-y" }}
    >
      {/* Dynamic border overlay based on drag direction */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-10 rounded-2xl"
        style={{
          border: "3px solid transparent",
        }}
      />

      {/* Document preview area */}
      <div className="flex-1 bg-slate-100 flex items-center justify-center relative">
        <div className="w-64 h-40 bg-slate-200 rounded-xl flex items-center justify-center">
          <TypeIcon className="w-16 h-16 text-slate-400" />
        </div>
        {/* Approve/reject overlay icons */}
        <div className="absolute inset-0 flex items-center justify-between px-6 pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
            <X className="w-6 h-6 text-red-400 opacity-40" />
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 opacity-40" />
          </div>
        </div>
      </div>

      {/* Document info */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <TypeIcon className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            {typeLabel}
          </span>
        </div>

        <div className="space-y-1.5">
          <InfoRow label="Cliente" value={doc.customerName} />
          <InfoRow label="Reserva" value={`#${doc.reservationId}`} />
          <InfoRow label="Subido hace" value={doc.uploadedAgo} />
        </div>

        {/* Action buttons (fallback for non-swipe) */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={onReject}
            className="flex-1 min-h-[48px] bg-red-50 text-red-600 font-bold text-sm rounded-xl
                       flex items-center justify-center gap-1.5 hover:bg-red-100 active:scale-[0.98] transition-all"
          >
            <X className="w-4 h-4" />
            Rechazar
          </button>
          <button
            onClick={onApprove}
            className="flex-1 min-h-[48px] bg-emerald-50 text-emerald-600 font-bold text-sm rounded-xl
                       flex items-center justify-center gap-1.5 hover:bg-emerald-100 active:scale-[0.98] transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            Aprobar
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}
