"use client";

import { useEffect, useState } from "react";
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
import { apiFetch } from "@/lib/api";
import { OPERATOR_PHONE } from "@/lib/constants";
import { createSSEConnection, type ConnectionStatus } from "@/lib/sse";
import { useTranslations } from "@/lib/i18n";

// â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type DocStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED";

interface LogEntry {
  text: string;
  status: "done" | "pending" | "error";
}

interface ApiDocument {
  type: "PASSPORT" | "DRIVING_LICENSE";
  status: DocStatus;
}

interface ApiReservation {
  id: string;
  documents?: ApiDocument[];
}

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function getDocStatus(
  docs: ApiDocument[],
  type: "PASSPORT" | "DRIVING_LICENSE",
): DocStatus {
  const doc = docs.find((d) => d.type === type);
  return doc?.status ?? "PENDING_REVIEW";
}

// â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface Props {
  reservationId: string | null;
}

export default function WaitingRoomClient({ reservationId }: Props) {
  const router = useRouter();

  const tWaiting = useTranslations("waitingRoom");
  const [passportStatus, setPassportStatus] =
    useState<DocStatus>("PENDING_REVIEW");
  const [licenseStatus, setLicenseStatus] =
    useState<DocStatus>("PENDING_REVIEW");
  const [rejectedType, setRejectedType] = useState<
    "PASSPORT" | "DRIVING_LICENSE" | null
  >(null);
  const [rejectionReason, setRejectionReason] = useState<string>(
    tWaiting.blurryReason,
  );
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("connecting");
  const [logs, setLogs] = useState<LogEntry[]>([
    { text: tWaiting.logReceived, status: "done" },
    { text: tWaiting.logConnecting, status: "pending" },
  ]);

  //  SSE real-time connection + one-time initial REST check

  useEffect(() => {
    if (!reservationId) return;

    // One-time REST check: sync document status that changed before SSE connected
    async function initialCheck() {
      try {
        const reservations = await apiFetch<ApiReservation[]>(
          "/reservations/my",
          {
            auth: true,
            cache: "no-store",
          },
        );
        const reservation = reservations.find((r) => r.id === reservationId);
        if (!reservation) return;
        const docs = reservation.documents ?? [];
        const passport = getDocStatus(docs, "PASSPORT");
        const license = getDocStatus(docs, "DRIVING_LICENSE");
        setPassportStatus(passport);
        setLicenseStatus(license);
        if (passport === "REJECTED") {
          setRejectedType("PASSPORT");
          setRejectionReason(tWaiting.blurryReason);
        } else if (license === "REJECTED") {
          setRejectedType("DRIVING_LICENSE");
          setRejectionReason(tWaiting.blurryReason);
        }
      } catch {
        /* SSE will surface updates */
      }
    }
    initialCheck();

    // SSE connection  JWT stays in HttpOnly cookie, never in URL
    const disconnect = createSSEConnection(
      {
        onStatusChange: (status) => {
          setConnectionStatus(status);
          if (status === "connected") {
            setLogs((prev) => [
              ...prev.filter((l) => l.text !== tWaiting.logConnecting),
              { text: tWaiting.logConnected, status: "pending" },
            ]);
          }
          if (status === "error") {
            setLogs((prev) => [
              ...prev,
              { text: tWaiting.logNoConnection, status: "error" },
            ]);
          }
        },
        onDocumentApproved: (data) => {
          if (data.reservationId !== reservationId) return;
          const type = data.documentType as "PASSPORT" | "DRIVING_LICENSE";
          if (type === "PASSPORT") setPassportStatus("APPROVED");
          if (type === "DRIVING_LICENSE") setLicenseStatus("APPROVED");
          const label =
            type === "PASSPORT" ? tWaiting.passport : tWaiting.license;
          setLogs((prev) => [
            ...prev,
            { text: `${label} — ${tWaiting.docApproved}`, status: "done" },
          ]);
        },
        onDocumentRejected: (data) => {
          if (data.reservationId !== reservationId) return;
          const type = data.documentType as "PASSPORT" | "DRIVING_LICENSE";
          setRejectedType(type);
          setRejectionReason(data.reason ?? tWaiting.blurryReason);
          const label =
            type === "PASSPORT" ? tWaiting.passport : tWaiting.license;
          setLogs((prev) => [
            ...prev,
            { text: `${label} — ${tWaiting.docRejected}`, status: "error" },
          ]);
        },
      },
      reservationId,
    );

    return disconnect;
  }, [reservationId]);

  // â”€â”€ Redirect on full approval â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  useEffect(() => {
    if (passportStatus === "APPROVED" && licenseStatus === "APPROVED") {
      const timer = setTimeout(() => {
        router.push(`/smart-ticket?reservationId=${reservationId}`);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [passportStatus, licenseStatus, router, reservationId]);

  // â”€â”€ WhatsApp link â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const whatsappUrl = `https://wa.me/${OPERATOR_PHONE}?text=${encodeURIComponent(
    tWaiting.whatsappMsg.replace("{id}", reservationId ?? ""),
  )}`;

  const allApproved =
    passportStatus === "APPROVED" && licenseStatus === "APPROVED";
  const someRejected = rejectedType !== null;

  // â”€â”€ Rejected state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  if (someRejected) {
    const docLabel =
      rejectedType === "PASSPORT"
        ? tWaiting.passport.toLowerCase()
        : tWaiting.license.toLowerCase();
    const docParam =
      rejectedType === "PASSPORT" ? "PASSPORT" : "DRIVING_LICENSE";

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
            <h2 className="text-lg font-bold text-brand-dark">
              {tWaiting.actionRequired}
            </h2>
          </div>

          <p className="text-sm text-brand-muted mb-2">
            {tWaiting.actionRequiredDoc.replace("{docLabel}", docLabel)}
          </p>
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-4">
            <p className="text-sm font-semibold text-amber-700">
              Motivo: &ldquo;{rejectionReason}&rdquo;
            </p>
          </div>
          <p className="text-sm text-brand-muted mb-5">{tWaiting.dontWorry}</p>

          <div className="flex flex-col gap-3">
            <Link
              href={`/check-in?reservationId=${reservationId}&retryType=${docParam}`}
              className="w-full min-h-[50px] bg-brand-primary text-white font-bold text-sm rounded-full
                         flex items-center justify-center gap-2
                         hover:bg-brand-primary-hover active:scale-[0.98]
                         shadow-[0_4px_20px_rgba(37,99,235,0.28)] transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              {tWaiting.reuploadDoc.replace("{docLabel}", docLabel)}
            </Link>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full min-h-[48px] bg-[#25D366] text-white font-bold text-sm rounded-full
                         flex items-center justify-center gap-2 hover:bg-[#1DA851] transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              {tWaiting.whatsappHelp}
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  // â”€â”€ Main waiting / approved state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
            <h1 className="text-white font-bold text-base">{tWaiting.title}</h1>
            <p className="text-slate-400 text-xs">
              {reservationId
                ? tWaiting.subtitle.replace("{id}", reservationId)
                : tWaiting.noReservation}
            </p>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Documents sent */}
          <div>
            <p className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-3">
              {tWaiting.docsSent}
            </p>
            <div className="space-y-2">
              <DocRow
                icon={FileText}
                label={tWaiting.passport}
                status={passportStatus}
              />
              <DocRow
                icon={CreditCard}
                label={tWaiting.license}
                status={licenseStatus}
              />
            </div>
          </div>

          {/* Status panel */}
          <div>
            <p className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-3">
              {tWaiting.status}
            </p>

            <AnimatePresence mode="wait">
              {allApproved ? (
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
                    <p className="text-sm font-bold text-brand-dark">
                      {tWaiting.approved}
                    </p>
                    <p className="text-xs text-brand-muted">
                      {tWaiting.redirecting}
                    </p>
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
                      <span
                        className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75
                        ${connectionStatus === "error" ? "bg-red-500" : connectionStatus === "connecting" ? "bg-amber-400" : "bg-brand-primary"}`}
                      />
                      <span
                        className={`relative inline-flex rounded-full h-3 w-3
                        ${connectionStatus === "error" ? "bg-red-500" : connectionStatus === "connecting" ? "bg-amber-400" : "bg-brand-primary"}`}
                      />
                    </span>
                    <p className="text-sm font-bold text-brand-dark">
                      {connectionStatus === "connecting"
                        ? tWaiting.connecting
                        : tWaiting.reviewing}
                    </p>
                  </div>
                  <p className="text-sm text-brand-muted">
                    {connectionStatus === "error"
                      ? tWaiting.connectionError
                      : tWaiting.reviewingLive}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-brand-muted">
                    <Clock className="w-3.5 h-3.5" />
                    {tWaiting.estimatedTime}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Terminal-style log feed */}
          <div>
            <p className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-3">
              {tWaiting.feedTitle}
            </p>
            <div className="bg-slate-50 rounded-xl p-3 space-y-2 font-mono text-xs max-h-36 overflow-y-auto">
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
                      transition={{
                        repeat: Infinity,
                        duration: 2,
                        ease: "linear",
                      }}
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
            <p className="text-xs text-brand-muted mb-2">
              {tWaiting.questionsWaiting}
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full min-h-[48px] bg-[#25D366] text-white font-bold text-sm rounded-full
                         flex items-center justify-center gap-2 hover:bg-[#1DA851] transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              {tWaiting.whatsappCTA}
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// â”€â”€ Doc row helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function DocRow({
  icon: Icon,
  label,
  status,
}: {
  icon: React.ElementType;
  label: string;
  status: DocStatus;
}) {
  const tWaiting = useTranslations("waitingRoom");
  return (
    <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5">
      <div className="flex items-center gap-2.5">
        <Icon className="w-4 h-4 text-brand-muted" />
        <span className="text-sm font-semibold text-brand-dark">{label}</span>
      </div>
      {status === "APPROVED" && (
        <span className="text-xs font-bold text-brand-success flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {tWaiting.docApproved}
        </span>
      )}
      {status === "REJECTED" && (
        <span className="text-xs font-bold text-red-500 flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5" />
          {tWaiting.docRejected}
        </span>
      )}
      {status === "PENDING_REVIEW" && (
        <span className="text-xs font-semibold text-brand-muted flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {tWaiting.docInReview}
        </span>
      )}
    </div>
  );
}
