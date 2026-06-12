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
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Clock,
  Wifi,
  WifiOff,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  MapPin,
  CalendarDays,
  CheckCircle2,
} from "lucide-react";
import { useReservationSse } from "./useReservationSse";
import { clientFetch } from "@/lib/api/client-fetch";
import { adaptReservation } from "@/features/reservations/reservation-adapters";
import { adaptDocuments } from "@/features/documents/document-adapters";
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
  return "docs_pending"; // Even if not all submitted, wait is the right UX
}

// ---------------------------------------------------------------------------
// Connection badge
// ---------------------------------------------------------------------------

function ConnectionBadge({ state }: { state: SseConnectionState }) {
  if (state === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">
        <Wifi aria-hidden="true" className="h-3 w-3" />
        Auto-updating
      </span>
    );
  }
  if (state === "degraded") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
        <WifiOff aria-hidden="true" className="h-3 w-3" />
        Reconnecting
      </span>
    );
  }
  if (state === "fallback") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
        <RefreshCw aria-hidden="true" className="h-3 w-3" />
        Polling
      </span>
    );
  }
  return null;
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
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);

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
      setLastRefreshedAt(new Date().toISOString());
    } catch {
      // Silently ignore refetch errors — SSE/poll will retry
    } finally {
      isRefetchingRef.current = false;
    }
  }, [reservation.id]);

  const handleSseEvent = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_sseEvent: SseRawEvent) => {
      // Always refetch — never trust SSE event data as truth
      refetch();
    },
    [refetch],
  );

  // ---------------------------------------------------------------------------
  // SSE hook
  // ---------------------------------------------------------------------------
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

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

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
    approved && reservation.hasQrCode
      ? { label: "View smart ticket", href: `/reservations/${reservation.id}/ticket` }
      : rejected
      ? { label: "Re-upload documents", href: `/reservations/${reservation.id}/check-in` }
      : undefined;

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
          ? "Your documents are approved and your smart ticket is active. Present the pickup pass when you meet your operator in the arrivals hall."
          : rejected
          ? "Our operator could not verify one of your uploaded documents. Please review the comments below and re-upload the file."
          : "Your documents are with the operator team. This page updates automatically, and you can return from My trips at any time."
      }
      prev={{ label: "Review submitted documents", href: `/reservations/${reservation.id}/check-in` }}
      next={navNext}
    >
      {/* Top mini-bar for live connection status */}
      <div className="flex items-center justify-between gap-4 border-b border-neutral-100 pb-4 mb-8 text-xs max-w-[500px] mx-auto">
        <div className="flex items-center gap-2 text-neutral-500 font-medium">
          <Clock aria-hidden="true" className="h-4 w-4" />
          <span>Status</span>
        </div>
        <div className="flex items-center gap-3">
          <ConnectionBadge state={connectionState} />
          {lastRefreshedAt && (
            <span className="text-neutral-400 font-light hidden sm:inline-block">
              Updated {formatTime(lastRefreshedAt)}
            </span>
          )}
          <button
            aria-label="Refresh reservation status"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 transition hover:bg-neutral-50 hover:text-neutral-950 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950"
            onClick={refetch}
            type="button"
          >
            <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="text-center max-w-[500px] mx-auto space-y-6">
        {/* Document Checklist Widget */}
        <div
          className="text-left rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-sm"
          role={rejected ? "alert" : "status"}
          aria-live="polite"
        >
          <div className="p-4.5 bg-neutral-50/40 border-b border-neutral-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-neutral-500" />
            <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Document Checklist</h3>
          </div>
          <div className="p-4.5 space-y-4">
            {REQUIRED_DOC_TYPES.map((type) => {
              const doc = documents.find((d) => d.type === type);
              const name = type === "PASSPORT" ? "Passport" : "Driving Licence";
              const statusStr = doc ? doc.status : "Missing";
              return (
                <div key={type} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-neutral-700">{name}</span>
                  {statusStr === "APPROVED" && (
                    <span className="text-green-700 font-medium text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                    </span>
                  )}
                  {statusStr === "REJECTED" && (
                    <span className="text-red-700 font-medium text-xs flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" /> Needs re-upload
                    </span>
                  )}
                  {statusStr === "PENDING_REVIEW" && (
                    <span className="text-amber-700 font-medium text-xs flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Under review
                    </span>
                  )}
                  {statusStr === "Missing" && (
                    <span className="text-neutral-500 font-medium text-xs">Missing</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Rejection comments wrapper */}
        {rejected && rejectedDocs.length > 0 && (
          <div className="rounded-2xl border border-red-200 bg-red-50/40 p-5 text-left space-y-2.5 text-xs shadow-sm">
            <p className="font-semibold text-red-950 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              Rejection feedback
            </p>
            {rejectedDocs.map((doc) => (
              <div key={doc.type} className="border-t border-red-100 pt-2 text-red-800 font-light leading-relaxed">
                <span className="font-semibold">
                  {doc.type === "PASSPORT" ? "Passport" : "Driving Licence"}:
                </span>{" "}
                {doc.rejectionReason || "No details provided. Please re-upload a clear and valid copy."}
              </div>
            ))}
          </div>
        )}

        {/* Compact Trip Summary Widget */}
        <div className="text-left rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
          <div className="flex items-center gap-4 p-4.5 border-b border-neutral-100 bg-neutral-50/40">
            {reservation.vehicle?.imageUrl && (
              <div className="w-20 h-14 rounded-xl overflow-hidden bg-neutral-50 border border-neutral-200/50 shrink-0 relative">
                <img
                  src={reservation.vehicle.imageUrl}
                  alt={reservation.vehicle.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              {reservation.vehicle?.category && (
                <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
                  {reservation.vehicle.category} Class
                </span>
              )}
              <h3 className="text-sm font-semibold text-neutral-900">
                {reservation.vehicle?.name || "Premium Vehicle"}
              </h3>
            </div>
          </div>
          <div className="p-4.5 space-y-3.5 text-xs">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-[#1E41FC] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-neutral-900">Pickup Location</p>
                <p className="text-neutral-500 font-light mt-0.5">
                  CMN &middot; Casablanca Airport {reservation.pickupLocation === "CMN_T1" ? "Terminal 1" : "Terminal 2"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 border-t border-neutral-100 pt-3">
              <CalendarDays className="w-4 h-4 text-[#1E41FC] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-neutral-900">Schedule</p>
                <p className="text-neutral-500 font-light mt-0.5">
                  {formatDateLabel(reservation.pickupDate)} &rarr; {formatDateLabel(reservation.returnDate)} &middot; {reservation.totalDays} {reservation.totalDays === 1 ? "day" : "days"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* What happens next */}
        <div className="text-left rounded-2xl border border-neutral-200 bg-neutral-50 p-5 space-y-2 shadow-sm">
          <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider mb-3">What happens next</h4>
          {!approved && (
            <p className="text-sm text-neutral-700 leading-relaxed font-light">
              <strong className="font-medium text-neutral-900">If approved:</strong> Your smart ticket and pickup instructions unlock automatically.<br />
              <strong className="font-medium text-neutral-900 mt-2 inline-block">If rejected:</strong> We&apos;ll show the reason and let you re-upload the document.<br />
              <strong className="font-medium text-neutral-900 mt-2 inline-block">If still pending:</strong> You can return from My trips without losing your place.
            </p>
          )}
          {approved && (
            <p className="text-sm text-neutral-700 leading-relaxed font-light">
              Your smart ticket is now unlocked. You can view your ticket to get your exact pickup instructions at the arrivals hall.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            className="inline-flex h-11 items-center justify-center rounded-full bg-neutral-950 px-6 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950"
            href="/dashboard"
          >
            Go to dashboard
          </Link>
          {!approved && (
            <Link
              className="inline-flex h-11 items-center justify-center rounded-full border border-neutral-200 bg-white px-6 text-sm font-semibold text-neutral-900 hover:bg-neutral-50 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950"
              href={`/reservations/${reservation.id}/check-in`}
            >
              Review submitted documents
            </Link>
          )}
        </div>

        {/* Internal Demo helper */}
        {process.env.NODE_ENV === "development" && !approved && (
          <div className="pt-6 border-t border-neutral-100">
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-neutral-100 mb-2">
              <AlertTriangle className="w-3 h-3 text-neutral-500" />
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Internal Demo Helper</span>
            </div>
            <p className="text-[10px] text-neutral-400 font-light leading-relaxed max-w-sm mx-auto">
              Open the{" "}
              <Link href="/operator/documents" className="text-[#1E41FC] font-medium hover:underline" target="_blank">
                Operator review panel
              </Link>{" "}
              in a new tab to approve these documents and watch this room update automatically.
            </p>
          </div>
        )}
      </div>
    </JourneyShell>
  );
}
