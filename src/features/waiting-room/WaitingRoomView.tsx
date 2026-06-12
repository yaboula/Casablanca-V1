"use client";

/**
 * WaitingRoomView — customer waiting room after document check-in.
 *
 * Receives server-fetched initial reservation and documents.
 * Attaches SSE for live updates. On SSE event or poll tick, refetches
 * reservation + documents via clientFetch — never trusts SSE data directly.
 *
 * Phase logic (derived from backend state):
 *   - Any doc REJECTED → docs_rejected (CTA: re-upload)
 *   - All required docs submitted (PENDING_REVIEW or APPROVED) → docs_pending
 *   - All docs APPROVED + reservation CONFIRMED → ready (CTA: view ticket)
 *   - Reservation CONFIRMED (docs may not all be approved yet) → confirmed
 *   - Reservation IN_PROGRESS → in_progress
 *   - Reservation COMPLETED → completed
 *   - Reservation CANCELLED → cancelled
 *   - Reservation AWAITING_CAPTURE → awaiting_capture (payment authorization required)
 */
import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  WifiOff,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  MapPin,
  CalendarDays,
  CheckCircle2,
  FileText,
  Clock,
  ArrowRight,
  Car,
} from "lucide-react";
import { useReservationSse } from "./useReservationSse";
import { clientFetch } from "@/lib/api/client-fetch";
import { adaptReservation } from "@/features/reservations/reservation-adapters";
import { adaptDocuments } from "@/features/documents/document-adapters";
import { canAccessCustomerTicket } from "@/features/reservations/reservation-helpers";
import type { ReservationViewModel } from "@/features/reservations/types";
import type { DocumentViewModel } from "@/features/documents/types";
import type { SseConnectionState, SseRawEvent, WaitingRoomPhase } from "./types";
import { JourneyShell } from "@/features/reservations/JourneyShell";

// ---------------------------------------------------------------------------
// Phase derivation
// ---------------------------------------------------------------------------

const REQUIRED_DOC_TYPES = ["PASSPORT", "DRIVING_LICENSE"] as const;

function derivePhase(
  reservation: ReservationViewModel,
  documents: DocumentViewModel[],
): WaitingRoomPhase {
  const { status } = reservation;

  if (status === "CANCELLED") return "cancelled";
  if (status === "COMPLETED") return "completed";
  if (status === "IN_PROGRESS") return "in_progress";
  if (status === "AWAITING_CAPTURE") return "awaiting_capture";

  // For PENDING_DEPOSIT and CONFIRMED: check document state
  const anyRejected = documents.some((d) => d.status === "REJECTED");
  if (anyRejected) return "docs_rejected";

  const allSubmitted = REQUIRED_DOC_TYPES.every((type) => {
    const doc = documents.find((d) => d.type === type);
    return doc?.status === "PENDING_REVIEW" || doc?.status === "APPROVED";
  });

  const allApproved = REQUIRED_DOC_TYPES.every((type) => {
    const doc = documents.find((d) => d.type === type);
    return doc?.status === "APPROVED";
  });

  if (status === "CONFIRMED") {
    if (allApproved) return "ready";
    return "confirmed";
  }

  // PENDING_DEPOSIT
  if (allSubmitted) return "docs_pending";
  return "docs_pending";
}

// ---------------------------------------------------------------------------
// Connection badge
// ---------------------------------------------------------------------------

function ConnectionBadge({ state }: { state: SseConnectionState }) {
  if (state === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
        </span>
        Live
      </span>
    );
  }
  if (state === "degraded") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
        <WifiOff aria-hidden="true" className="h-3 w-3" />
        Reconnecting
      </span>
    );
  }
  if (state === "fallback") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
        <RefreshCw aria-hidden="true" className="h-3 w-3" />
        Polling
      </span>
    );
  }
  return null;
}

// ---------------------------------------------------------------------------
// Document row
// ---------------------------------------------------------------------------

type DocStatus = "APPROVED" | "REJECTED" | "PENDING_REVIEW" | "Missing";

function DocRow({ label, status }: { label: string; status: DocStatus }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-neutral-100 last:border-0">
      <div className="flex items-center gap-3">
        <div
          className={[
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
            status === "APPROVED"
              ? "bg-green-50"
              : status === "REJECTED"
              ? "bg-red-50"
              : "bg-neutral-100",
          ].join(" ")}
        >
          <FileText
            className={[
              "h-4 w-4",
              status === "APPROVED"
                ? "text-green-600"
                : status === "REJECTED"
                ? "text-red-500"
                : "text-neutral-400",
            ].join(" ")}
          />
        </div>
        <span className="text-sm font-medium text-neutral-800">{label}</span>
      </div>

      {status === "APPROVED" && (
        <span className="flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-[11px] font-semibold text-green-700">
          <CheckCircle2 className="h-3 w-3" />
          Approved
        </span>
      )}
      {status === "REJECTED" && (
        <span className="flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-3 py-1 text-[11px] font-semibold text-red-700">
          <AlertCircle className="h-3 w-3" />
          Action needed
        </span>
      )}
      {status === "PENDING_REVIEW" && (
        <span className="flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-[11px] font-semibold text-amber-700">
          <Clock className="h-3 w-3" />
          Under review
        </span>
      )}
      {status === "Missing" && (
        <span className="rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-semibold text-neutral-500">
          Not uploaded
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type WaitingRoomViewProps = {
  reservation: ReservationViewModel;
  initialDocuments: DocumentViewModel[];
};

// ---------------------------------------------------------------------------
// WaitingRoomView
// ---------------------------------------------------------------------------

export function WaitingRoomView({
  reservation: initialReservation,
  initialDocuments,
}: WaitingRoomViewProps) {
  const [reservation, setReservation] =
    useState<ReservationViewModel>(initialReservation);
  const [documents, setDocuments] =
    useState<DocumentViewModel[]>(initialDocuments);
  const [connectionState, setConnectionState] =
    useState<SseConnectionState>("live");

  const phase = derivePhase(reservation, documents);
  const isTerminal =
    phase === "cancelled" || phase === "completed" || phase === "in_progress";

  const approved = phase === "ready" || phase === "confirmed";
  const rejected = phase === "docs_rejected";

  // Track refetch to avoid duplicate in-flight requests
  const isRefetchingRef = useRef(false);

  // ---------------------------------------------------------------------------
  // Refetch from backend (called on SSE event or poll tick)
  // ---------------------------------------------------------------------------
  const refetch = useCallback(async () => {
    if (isRefetchingRef.current) return;
    isRefetchingRef.current = true;

    try {
      const [resRaw, docsRaw] = await Promise.all([
        clientFetch<{ data: unknown }>(`/reservations/${reservation.id}`),
        clientFetch<{ data: unknown[] }>(`/documents/${reservation.id}`),
      ]);

      const adapted = adaptReservation(resRaw.data as Parameters<typeof adaptReservation>[0]);
      if (adapted) setReservation(adapted);

      const adaptedDocs = adaptDocuments(docsRaw.data ?? []);
      setDocuments(adaptedDocs);
    } catch {
      // Silently ignore refetch errors — SSE/poll will retry
    } finally {
      isRefetchingRef.current = false;
    }
  }, [reservation.id]);

  const handleSseEvent = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_sseEvent: SseRawEvent) => {
      refetch();
    },
    [refetch],
  );

  useReservationSse({
    reservationId: reservation.id,
    onEvent: handleSseEvent,
    onConnectionStateChange: setConnectionState,
    onPollTick: refetch,
    disabled: isTerminal,
  });

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const rejectedDocs = documents.filter((d) => d.status === "REJECTED");

  const formatDateLabel = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      });
    } catch {
      return iso;
    }
  };

  const navNext =
    approved && canAccessCustomerTicket(reservation)
      ? { label: "View smart ticket", href: `/reservations/${reservation.id}/ticket` }
      : rejected
      ? { label: "Re-upload documents", href: `/reservations/${reservation.id}/check-in` }
      : undefined;

  // Status indicator config
  const statusConfig = approved
    ? {
        label: "Approved",
        bg: "bg-green-50",
        border: "border-green-200",
        text: "text-green-700",
        icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
        pulse: false,
      }
    : rejected
    ? {
        label: "Action required",
        bg: "bg-red-50",
        border: "border-red-200",
        text: "text-red-700",
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
        pulse: false,
      }
    : {
        label: "Under review",
        bg: "bg-amber-50",
        border: "border-amber-200",
        text: "text-amber-700",
        icon: <Clock className="h-5 w-5 text-amber-500" />,
        pulse: true,
      };

  return (
    <JourneyShell
      currentStep="verify"
      reservationId={reservation.id}
      vehicleId={reservation.vehicle?.id}
      heading={
        approved
          ? "You are ready to drive."
          : rejected
          ? "One document needs attention."
          : "Documents in review."
      }
      subtitle={
        approved
          ? canAccessCustomerTicket(reservation)
            ? "Your documents are approved and your smart ticket is active."
            : "Your documents are approved and payment capture is being finalized."
          : rejected
          ? "An operator could not verify one of your documents. Review the feedback below and re-upload."
          : "Your documents are with the operator team. This page updates automatically."
      }
      prev={{ label: "Review submitted documents", href: `/reservations/${reservation.id}/check-in` }}
      next={navNext}
    >
      {/* ── Two-column grid ── */}
      <div className="mt-2 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px]">

        {/* ── LEFT — Status hero + document checklist ── */}
        <div className="flex flex-col gap-5">

          {/* Status hero card */}
          <div className={[
            "relative overflow-hidden rounded-2xl border p-7",
            statusConfig.bg,
            statusConfig.border,
          ].join(" ")}>
            {/* Subtle background ring */}
            {statusConfig.pulse && (
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-100/50" />
            )}

            <div className="relative flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={[
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border",
                  statusConfig.bg,
                  statusConfig.border,
                ].join(" ")}>
                  {statusConfig.icon}
                </div>
                <div>
                  <p className={["text-xs font-bold uppercase tracking-widest mb-1", statusConfig.text].join(" ")}>
                    {statusConfig.label}
                  </p>
                  <h2 className="text-xl font-bold text-neutral-950 leading-snug">
                    {approved
                      ? "Your documents have been approved"
                      : rejected
                      ? "One document needs to be re-uploaded"
                      : "Operator is reviewing your documents"}
                  </h2>
                  <p className="mt-1.5 text-sm text-neutral-600 font-light leading-relaxed">
                    {approved
                      ? canAccessCustomerTicket(reservation)
                        ? "Present your smart ticket at the arrivals hall when you meet your operator."
                        : "Your pickup pass will appear automatically as soon as payment capture is confirmed."
                      : rejected
                      ? "Check the feedback below and re-upload the required file to continue."
                      : "This page updates automatically. You can safely leave and return from My trips."}
                  </p>
                </div>
              </div>

              {/* Live badge + refresh — top right */}
              <div className="flex shrink-0 flex-col items-end gap-2">
                <ConnectionBadge state={connectionState} />
                <button
                  aria-label="Refresh status"
                  onClick={refetch}
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white/80 text-neutral-400 transition hover:text-neutral-900 hover:border-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Rejection feedback inline */}
            {rejected && rejectedDocs.length > 0 && (
              <div className="mt-5 rounded-xl border border-red-200 bg-white/70 p-4 space-y-2">
                <p className="flex items-center gap-2 text-xs font-bold text-red-900 uppercase tracking-wider">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                  Operator feedback
                </p>
                {rejectedDocs.map((doc) => (
                  <div key={doc.type} className="text-sm text-red-800 font-light leading-relaxed">
                    <span className="font-semibold">
                      {doc.type === "PASSPORT" ? "Passport" : "Driving Licence"}:
                    </span>{" "}
                    {doc.rejectionReason || "Please re-upload a clear and valid copy of this document."}
                  </div>
                ))}
              </div>
            )}

            {/* Approved CTA */}
            {approved && canAccessCustomerTicket(reservation) && (
              <div className="mt-5">
                <Link
                  href={`/reservations/${reservation.id}/ticket`}
                  className="inline-flex items-center gap-2 rounded-full bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
                >
                  View smart ticket
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>

          {/* Document checklist card */}
          <div
            className="rounded-2xl border border-neutral-200 bg-white overflow-hidden"
            role={rejected ? "alert" : "status"}
            aria-live="polite"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-neutral-400" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                  Documents
                </h3>
              </div>
              <span className="text-[11px] text-neutral-400 font-light">
                {documents.filter((d) => d.status === "APPROVED").length} / {REQUIRED_DOC_TYPES.length} approved
              </span>
            </div>

            <div className="px-6">
              {REQUIRED_DOC_TYPES.map((type) => {
                const doc = documents.find((d) => d.type === type);
                const name = type === "PASSPORT" ? "Passport" : "Driving Licence";
                const statusStr: DocStatus = doc ? (doc.status as DocStatus) : "Missing";
                return <DocRow key={type} label={name} status={statusStr} />;
              })}
            </div>
          </div>

          {/* What happens next — collapsed, non-prominent */}
          {!approved && (
            <div className="rounded-2xl border border-neutral-100 bg-neutral-50 px-6 py-5">
              <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-4">
                What happens next
              </h4>
              <ol className="space-y-3">
                {[
                  {
                    n: 1,
                    title: "Operator reviews your documents",
                    body: "Review timing depends on document clarity and queue volume.",
                  },
                  {
                    n: 2,
                    title: rejected ? "Re-upload the flagged document" : "Approval unlocks your ticket",
                    body: rejected
                      ? "Once you re-upload, the operator will review it again."
                      : "Your smart pickup ticket becomes active once your reservation is confirmed and payment capture completes.",
                  },
                  {
                    n: 3,
                    title: "Meet your operator at the arrivals hall",
                    body: "Present your ticket and collect your vehicle.",
                  },
                ].map((item) => (
                  <li key={item.n} className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-[10px] font-bold text-neutral-500 mt-0.5">
                      {item.n}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-neutral-800">{item.title}</p>
                      <p className="text-xs text-neutral-500 font-light mt-0.5 leading-relaxed">{item.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* ── RIGHT — Trip summary sidebar ── */}
        <div className="flex flex-col gap-5">
          {/* Vehicle card */}
          <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
            {reservation.vehicle?.imageUrl && (
              <div className="relative h-44 w-full overflow-hidden bg-neutral-100">
                <img
                  src={reservation.vehicle.imageUrl}
                  alt={reservation.vehicle.name ?? "Vehicle"}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            {!reservation.vehicle?.imageUrl && (
              <div className="flex h-32 w-full items-center justify-center bg-neutral-50">
                <Car className="h-8 w-8 text-neutral-300" />
              </div>
            )}
            <div className="px-5 py-4">
              {reservation.vehicle?.category && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                  {reservation.vehicle.category} Class
                </p>
              )}
              <h3 className="mt-0.5 text-base font-bold text-neutral-950">
                {reservation.vehicle?.name ?? "Premium Vehicle"}
              </h3>
            </div>
          </div>

          {/* Booking details card */}
          <div className="rounded-2xl border border-neutral-200 bg-white divide-y divide-neutral-100">
            <div className="flex items-start gap-4 px-5 py-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1E41FC]/8">
                <MapPin className="h-4 w-4 text-[#1E41FC]" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  Pickup location
                </p>
                <p className="mt-0.5 text-sm font-semibold text-neutral-950">
                  Casablanca Mohammed V
                </p>
                <p className="text-xs text-neutral-500 font-light mt-0.5">
                  {reservation.pickupLocation === "CMN_T1" ? "Terminal 1" : "Terminal 2"} · CMN
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 px-5 py-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1E41FC]/8">
                <CalendarDays className="h-4 w-4 text-[#1E41FC]" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  Rental period
                </p>
                <p className="mt-0.5 text-sm font-semibold text-neutral-950">
                  {formatDateLabel(reservation.pickupDate)} → {formatDateLabel(reservation.returnDate)}
                </p>
                <p className="text-xs text-neutral-500 font-light mt-0.5">
                  {reservation.totalDays} {reservation.totalDays === 1 ? "day" : "days"}
                </p>
              </div>
            </div>
          </div>

          {/* My trips shortcut */}
          <Link
            href="/dashboard"
            className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 hover:text-neutral-950"
          >
            <span>Go to My trips</span>
            <ArrowRight className="h-4 w-4 text-neutral-400" />
          </Link>

          {/* Internal dev helper — development only */}
          {process.env.NODE_ENV === "development" && !approved && (
            <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">
                Dev helper
              </p>
              <p className="text-[11px] text-neutral-400 font-light leading-relaxed">
                Open the{" "}
                <Link
                  href="/operator/documents"
                  target="_blank"
                  className="text-[#1E41FC] font-semibold hover:underline"
                >
                  Operator review panel
                </Link>{" "}
                to approve documents and see this page update live.
              </p>
            </div>
          )}
        </div>
      </div>
    </JourneyShell>
  );
}
