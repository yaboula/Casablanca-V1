"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  FileText,
  CreditCard,
  MessageCircle,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { OPERATOR_PHONE } from "@/lib/constants";

// ── Types ─────────────────────────────────────────────────────

type DocStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED";

interface LogEntry {
  text: string;
  status: "done" | "pending" | "error";
}

// ── Mock status simulation ────────────────────────────────────

const MOCK_APPROVAL_SECONDS = 25;

// ── Component ─────────────────────────────────────────────────

interface Props {
  reservationId: string;
}

export default function WaitingRoomClient({ reservationId }: Props) {
  const router = useRouter();

  const [docStatus, setDocStatus] = useState<DocStatus>("PENDING_REVIEW");
  const [logs, setLogs] = useState<LogEntry[]>([
    { text: "Documentos recibidos en servidor", status: "done" },
  ]);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);

  // ── Simulated polling ───────────────────────────────────────

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(
      setTimeout(() => {
        setLogs((prev) => [...prev, { text: "Iniciando verificación manual", status: "done" }]);
      }, 3000)
    );

    timers.push(
      setTimeout(() => {
        setLogs((prev) => [...prev, { text: "En cola de revisión (pos. 2)", status: "pending" }]);
      }, 6000)
    );

    timers.push(
      setTimeout(() => {
        setLogs((prev) => {
          const updated = [...prev];
          const idx = updated.findIndex((l) => l.text.includes("pos. 2"));
          if (idx >= 0) updated[idx] = { text: "En cola de revisión (pos. 1)", status: "pending" };
          return updated;
        });
      }, 12000)
    );

    timers.push(
      setTimeout(() => {
        setLogs((prev) => {
          const updated = [...prev];
          const idx = updated.findIndex((l) => l.text.includes("pos."));
          if (idx >= 0) updated[idx] = { text: "Tu documento está siendo revisado ahora", status: "pending" };
          return updated;
        });
      }, 18000)
    );

    timers.push(
      setTimeout(() => {
        setLogs((prev) => {
          const updated = [...prev];
          const queueIdx = updated.findIndex((l) => l.text.includes("cola"));
          if (queueIdx >= 0) updated[queueIdx] = { ...updated[queueIdx], status: "done" };
          return [...updated, { text: "Verificación completada", status: "done" }];
        });
        setDocStatus("APPROVED");
      }, MOCK_APPROVAL_SECONDS * 1000)
    );

    return () => timers.forEach(clearTimeout);
  }, []);

  // ── Redirect on approval ───────────────────────────────────

  useEffect(() => {
    if (docStatus === "APPROVED") {
      const timer = setTimeout(() => {
        router.push(`/smart-ticket?reservationId=${reservationId}`);
      }, 2000);
      return () => clearTimeout(timer);
    }
    if (docStatus === "REJECTED") {
      setRejectionReason("Imagen borrosa o incompleta");
    }
  }, [docStatus, router, reservationId]);

  // ── WhatsApp link ──────────────────────────────────────────

  const whatsappUrl = `https://wa.me/${OPERATOR_PHONE}?text=${encodeURIComponent(
    `Hola, tengo la reserva #${reservationId} y estoy esperando la verificación de mis documentos.`
  )}`;

  // ── Rejected state ─────────────────────────────────────────

  if (docStatus === "REJECTED") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 max-w-sm w-full"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <h2 className="text-lg font-bold text-brand-dark">Acción requerida</h2>
          </div>

          <p className="text-sm text-brand-muted mb-2">
            Tu pasaporte no pudo ser verificado.
          </p>
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-4">
            <p className="text-sm font-semibold text-amber-700">
              Motivo: &ldquo;{rejectionReason}&rdquo;
            </p>
          </div>
          <p className="text-sm text-brand-muted mb-5">
            No te preocupes, pasa frecuentemente con fotos tomadas con poca luz.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href={`/check-in?reservationId=${reservationId}&retry=true`}
              className="w-full min-h-[50px] bg-brand-primary text-white font-bold text-sm rounded-full
                         flex items-center justify-center gap-2
                         hover:bg-brand-primary-hover active:scale-[0.98]
                         shadow-[0_4px_20px_rgba(37,99,235,0.28)] transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Volver a subir pasaporte
            </Link>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full min-h-[48px] bg-[#25D366] text-white font-bold text-sm rounded-full
                         flex items-center justify-center gap-2 hover:bg-[#1DA851] transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              ¿Necesitas ayuda? WhatsApp
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Main waiting state ─────────────────────────────────────

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden"
      >
        {/* Header */}
        <div className="bg-brand-dark px-5 py-4 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-brand-primary" />
          <div>
            <h1 className="text-white font-bold text-base">Verificación de Seguridad</h1>
            <p className="text-slate-400 text-xs">Reserva #{reservationId}</p>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Documents sent */}
          <div>
            <p className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-3">
              Documentos Enviados
            </p>
            <div className="space-y-2">
              <DocRow icon={FileText} label="Pasaporte" status="RECEIVED" />
              <DocRow icon={CreditCard} label="Carnet de Conducir" status="RECEIVED" />
            </div>
          </div>

          {/* Status panel */}
          <div>
            <p className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-3">
              Estado de Verificación
            </p>

            <AnimatePresence mode="wait">
              {docStatus === "APPROVED" ? (
                <motion.div
                  key="approved"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  >
                    <CheckCircle2 className="w-8 h-8 text-brand-success" />
                  </motion.div>
                  <div>
                    <p className="text-sm font-bold text-brand-dark">¡Perfil Verificado!</p>
                    <p className="text-xs text-brand-muted">Redirigiendo a tu Smart Ticket…</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="reviewing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-brand-primary/5 border border-brand-primary/15 rounded-xl p-4"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-primary" />
                    </span>
                    <p className="text-sm font-bold text-brand-dark">En Revisión</p>
                  </div>
                  <p className="text-sm text-brand-muted">
                    Nuestro equipo revisa tus documentos manualmente.
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-brand-muted">
                    <Clock className="w-3.5 h-3.5" />
                    Tiempo estimado: &lt; 2 horas
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Terminal-style log feed */}
          <div>
            <p className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-3">
              Feed de Estado
            </p>
            <div className="bg-slate-50 rounded-xl p-3 space-y-2 font-mono text-xs">
              {logs.map((log, i) => (
                <motion.div
                  key={`${log.text}-${i}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-2"
                >
                  <span className="text-brand-muted">&gt;</span>
                  <span className="text-slate-600 flex-1">{log.text}</span>
                  {log.status === "done" && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-success shrink-0" />
                  )}
                  {log.status === "pending" && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                    </motion.div>
                  )}
                  {log.status === "error" && (
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* WhatsApp CTA */}
          <div className="pt-1">
            <p className="text-xs text-brand-muted mb-2">¿Preguntas mientras esperas?</p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full min-h-[48px] bg-[#25D366] text-white font-bold text-sm rounded-full
                         flex items-center justify-center gap-2 hover:bg-[#1DA851] transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp con nuestro equipo
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Doc row helper ───────────────────────────────────────────

function DocRow({
  icon: Icon,
  label,
  status,
}: {
  icon: React.ElementType;
  label: string;
  status: "RECEIVED" | "PENDING";
}) {
  return (
    <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5">
      <div className="flex items-center gap-2.5">
        <Icon className="w-4 h-4 text-brand-muted" />
        <span className="text-sm font-semibold text-brand-dark">{label}</span>
      </div>
      {status === "RECEIVED" ? (
        <span className="text-xs font-bold text-brand-success flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Recibido
        </span>
      ) : (
        <span className="text-xs font-semibold text-brand-muted">Pendiente</span>
      )}
    </div>
  );
}
