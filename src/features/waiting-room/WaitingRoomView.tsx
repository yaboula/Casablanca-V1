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
 *   - Reservation AWAITING_CAPTURE → awaiting_capture (payment processing)
 */

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  Wifi,
  WifiOff,
  RefreshCw,
  ArrowRight,
  Ticket,
  Car,
} from "lucide-react";
import { useReservationSse } from "./useReservationSse";
import { clientFetch } from "@/lib/api/client-fetch";
import { adaptReservation } from "@/features/reservations/reservation-adapters";
import { adaptDocuments } from "@/features/documents/document-adapters";
import type { ReservationViewModel } from "@/features/reservations/types";
import type { DocumentViewModel } from "@/features/documents/types";
import type { SseConnectionState, SseRawEvent, WaitingRoomPhase } from "./types";

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
        Live
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
// Document summary row
// ---------------------------------------------------------------------------

function DocumentRow({ doc, type }: { doc: DocumentViewModel | null; type: string }) {
  const label = type === "PASSPORT" ? "Passport" : "Driving Licence";

  if (!doc) {
    return (
      <div className="flex items-center justify-between py-3">
        <span className="text-sm text-neutral-600">{label}</span>
        <span className="text-xs text-neutral-400">Not uploaded</span>
      </div>
    );
  }

  const statusConfig = {
    PENDING_REVIEW: {
      label: "Awaiting review",
      class: "text-amber-700 bg-amber-50 border-amber-200",
    },
    APPROVED: {
      label: "Approved",
      class: "text-green-700 bg-green-50 border-green-200",
    },
    REJECTED: {
      label: "Rejected",
      class: "text-red-700 bg-red-50 border-red-200",
    },
  } as const;

  const cfg = statusConfig[doc.status];

  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-bold text-neutral-950">{label}</p>
        {doc.status === "REJECTED" && doc.rejectionReason && (
          <p className="mt-0.5 text-xs text-red-700">
            Reason: {doc.rejectionReason}
          </p>
        )}
      </div>
      <span
        className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-bold ${cfg.class}`}
      >
        {cfg.label}
      </span>
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
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);

  const phase = derivePhase(reservation, documents);
  const isTerminal =
    phase === "cancelled" || phase === "completed" || phase === "in_progress";

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

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <article className="mx-auto w-full max-w-3xl px-6 py-10 md:py-14">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Clock aria-hidden="true" className="h-5 w-5 text-[var(--nx-accent)]" />
            <span className="text-xs font-black uppercase tracking-[0.14em] text-neutral-500">
              Waiting room
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ConnectionBadge state={connectionState} />
            <button
              aria-label="Refresh status"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--nx-line)] bg-white text-neutral-500 transition hover:bg-neutral-50 hover:text-neutral-950"
              onClick={refetch}
              type="button"
            >
              <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <h1 className="mt-4 text-4xl font-black text-neutral-950">
          {phase === "docs_rejected"
            ? "Action required"
            : phase === "docs_pending"
              ? "Documents under review"
              : phase === "ready" || phase === "confirmed"
                ? "Reservation confirmed"
                : phase === "in_progress"
                  ? "Your rental is active"
                  : phase === "completed"
                    ? "Rental completed"
                    : phase === "cancelled"
                      ? "Reservation cancelled"
                      : phase === "awaiting_capture"
                        ? "Payment processing"
                        : "Waiting for update"}
        </h1>

        <p className="mt-2 text-sm text-neutral-500">
          Reservation:{" "}
          <span className="font-mono text-neutral-950">
            {reservation.id}
          </span>
        </p>

        {lastRefreshedAt && (
          <p
            aria-live="polite"
            className="mt-1 text-xs text-neutral-400"
          >
            Last updated: {formatTime(lastRefreshedAt)}
          </p>
        )}

        {connectionState === "fallback" && (
          <p
            aria-live="polite"
            className="mt-2 text-xs text-amber-700"
            role="status"
          >
            Live connection unavailable — refreshing every 20 seconds.
          </p>
        )}

        {connectionState === "degraded" && (
          <p
            aria-live="polite"
            className="mt-2 text-xs text-amber-700"
            role="status"
          >
            Connection interrupted — attempting to reconnect.
          </p>
        )}
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Phase banners                                                         */}
      {/* ------------------------------------------------------------------ */}

      {/* docs_rejected */}
      {phase === "docs_rejected" && (
        <div
          className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-5 py-4"
          role="alert"
        >
          <AlertTriangle
            aria-hidden="true"
            className="mt-0.5 h-5 w-5 shrink-0 text-red-600"
          />
          <div>
            <p className="font-black text-red-950">Document rejected</p>
            <p className="mt-1 text-sm text-red-800">
              One or more of your documents was rejected. Please re-upload a
              clear, valid document.
            </p>
            {rejectedDocs.map((doc) =>
              doc.rejectionReason ? (
                <p key={doc.type} className="mt-1 text-xs text-red-700">
                  {doc.type === "PASSPORT" ? "Passport" : "Driving Licence"}:{" "}
                  {doc.rejectionReason}
                </p>
              ) : null,
            )}
            <Link
              className="mt-4 inline-flex min-h-10 items-center gap-1.5 rounded-md bg-red-800 px-5 text-sm font-bold text-white transition hover:bg-red-900"
              href={`/reservations/${reservation.id}/check-in`}
            >
              Re-upload documents <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* docs_pending */}
      {phase === "docs_pending" && (
        <div
          aria-live="polite"
          className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-5 py-4"
          role="status"
        >
          <Clock
            aria-hidden="true"
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
          />
          <div>
            <p className="font-black text-amber-950">Awaiting operator review</p>
            <p className="mt-1 text-sm text-amber-800">
              Your documents have been submitted. An operator will review them
              and you will be notified when the status changes.
            </p>
          </div>
        </div>
      )}

      {/* awaiting_capture */}
      {phase === "awaiting_capture" && (
        <div
          aria-live="polite"
          className="mb-6 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-5 py-4"
          role="status"
        >
          <RefreshCw
            aria-hidden="true"
            className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-blue-600"
          />
          <div>
            <p className="font-black text-blue-950">Payment processing</p>
            <p className="mt-1 text-sm text-blue-800">
              Your deposit authorization is being processed. This usually takes
              a few seconds.
            </p>
          </div>
        </div>
      )}

      {/* confirmed / ready */}
      {(phase === "confirmed" || phase === "ready") && (
        <div
          aria-live="polite"
          className="mb-6 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-5 py-4"
          role="status"
        >
          <CheckCircle2
            aria-hidden="true"
            className="mt-0.5 h-5 w-5 shrink-0 text-green-600"
          />
          <div className="flex-1">
            <p className="font-black text-green-950">Reservation confirmed</p>
            <p className="mt-1 text-sm text-green-800">
              Your reservation is confirmed and ready for pickup at CMN.
            </p>
            {phase === "ready" && reservation.hasQrCode && (
              <Link
                className="mt-4 inline-flex min-h-10 items-center gap-1.5 rounded-md bg-neutral-950 px-5 text-sm font-bold text-white transition hover:bg-neutral-800"
                href={`/reservations/${reservation.id}/ticket`}
              >
                <Ticket aria-hidden="true" className="h-4 w-4" />
                View smart ticket
                <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* in_progress */}
      {phase === "in_progress" && (
        <div
          className="mb-6 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-5 py-4"
          role="status"
        >
          <Car
            aria-hidden="true"
            className="mt-0.5 h-5 w-5 shrink-0 text-green-700"
          />
          <div>
            <p className="font-black text-green-950">Rental in progress</p>
            <p className="mt-1 text-sm text-green-800">
              Your vehicle has been handed over. Enjoy your trip.
            </p>
          </div>
        </div>
      )}

      {/* completed */}
      {phase === "completed" && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-[var(--nx-line)] bg-white px-5 py-4">
          <CheckCircle2
            aria-hidden="true"
            className="mt-0.5 h-5 w-5 shrink-0 text-neutral-600"
          />
          <div>
            <p className="font-black text-neutral-950">Rental completed</p>
            <p className="mt-1 text-sm text-neutral-700">
              Thank you for choosing Nexus Mobility.
            </p>
          </div>
        </div>
      )}

      {/* cancelled */}
      {phase === "cancelled" && (
        <div
          className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-5 py-4"
          role="alert"
        >
          <AlertTriangle
            aria-hidden="true"
            className="mt-0.5 h-5 w-5 shrink-0 text-red-600"
          />
          <div>
            <p className="font-black text-red-950">Reservation cancelled</p>
            <p className="mt-1 text-sm text-red-800">
              This reservation has been cancelled.
            </p>
            <Link
              className="mt-4 inline-flex min-h-10 items-center gap-1.5 rounded-md bg-neutral-950 px-5 text-sm font-bold text-white transition hover:bg-neutral-800"
              href="/catalog"
            >
              Browse vehicles
            </Link>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Document status cards                                                 */}
      {/* ------------------------------------------------------------------ */}
      {!isTerminal && (
        <div className="rounded-lg border border-[var(--nx-line)] bg-white">
          <div className="border-b border-[var(--nx-line)] px-6 py-4">
            <h2 className="text-sm font-black text-neutral-950">
              Document status
            </h2>
          </div>
          <div className="divide-y divide-[var(--nx-line)] px-6">
            {REQUIRED_DOC_TYPES.map((type) => (
              <DocumentRow
                doc={documents.find((d) => d.type === type) ?? null}
                key={type}
                type={type}
              />
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Navigation                                                            */}
      {/* ------------------------------------------------------------------ */}
      <div className="mt-8 flex flex-col gap-3 border-t border-[var(--nx-line)] pt-6 sm:flex-row sm:items-center sm:justify-between">
        <Link
          className="text-sm font-bold text-neutral-950 underline decoration-neutral-400 underline-offset-2 hover:decoration-neutral-950"
          href={`/reservations/${reservation.id}/check-in`}
        >
          ← Back to document check-in
        </Link>

        <div className="flex items-center gap-3">
          {(phase === "ready" || phase === "confirmed") &&
            reservation.hasQrCode && (
              <Link
                className="inline-flex min-h-10 items-center gap-1.5 rounded-md bg-neutral-950 px-5 text-sm font-bold text-white transition hover:bg-neutral-800"
                href={`/reservations/${reservation.id}/ticket`}
              >
                <Ticket aria-hidden="true" className="h-4 w-4" />
                Smart ticket
              </Link>
            )}
          <Link
            className="inline-flex min-h-10 items-center rounded-md border border-[var(--nx-line)] bg-white px-5 text-sm font-bold text-neutral-950 transition hover:bg-neutral-50"
            href="/dashboard"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </article>
  );
}
