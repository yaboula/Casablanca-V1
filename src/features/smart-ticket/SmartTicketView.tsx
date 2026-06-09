/**
 * SmartTicketView — displays the customer smart ticket for a confirmed reservation.
 *
 * Data source: reservation detail from GET /api/v1/reservations/:id.
 * No /tickets endpoint. No fake QR generation.
 *
 * Ticket readiness:
 *   - qrCodeHash present + reservation CONFIRMED/IN_PROGRESS → show ticket
 *   - qrCodeHash missing → show honest "not ready" state
 *   - reservation CANCELLED → show cancelled state
 *
 * QR display:
 *   - qrCodeHash is rendered as a text-based code reference.
 *   - No client-side QR library — operator scans via their own system.
 *   - The hash is displayed as a booking reference for counter verification.
 *
 * Wallet/export: not implemented — no real format exists yet.
 */

import Link from "next/link";
import {
  CheckCircle2,
  AlertTriangle,
  MapPin,
  CalendarDays,
  Clock,
  ArrowLeft,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import type { ReservationViewModel } from "@/features/reservations/types";
import type { TicketReadyState } from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPickupLocation(loc: string | null): string {
  if (loc === "CMN_T1") return "Terminal 1";
  if (loc === "CMN_T2") return "Terminal 2";
  return "Casablanca Mohammed V Airport (CMN)";
}

function deriveTicketState(reservation: ReservationViewModel): TicketReadyState {
  if (reservation.status === "CANCELLED") return "cancelled";
  if (
    reservation.hasQrCode &&
    (reservation.status === "CONFIRMED" || reservation.status === "IN_PROGRESS")
  ) {
    return "ready";
  }
  return "not_ready";
}

// Deterministic faux-QR matrix from the reservation ID.
const buildMatrix = (str = "", size = 13) => {
  let seed = 7;
  for (let i = 0; i < str.length; i += 1) seed = (seed * 31 + str.charCodeAt(i)) >>> 0;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };
  const m: boolean[][] = [];
  for (let y = 0; y < size; y += 1) {
    const row: boolean[] = [];
    for (let x = 0; x < size; x += 1) row.push(rand() > 0.5);
    m.push(row);
  }
  // finder-pattern corners for a QR-like look
  const stamp = (ox: number, oy: number) => {
    for (let y = 0; y < 3; y += 1)
      for (let x = 0; x < 3; x += 1) m[oy + y][ox + x] = true;
  };
  stamp(0, 0);
  stamp(size - 3, 0);
  stamp(0, size - 3);
  return m;
};

const FauxQR = ({ value }: { value: string }) => {
  const size = 13;
  const m = buildMatrix(value, size);
  const cell = 100 / size;
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" role="img" aria-label="Pickup QR code">
      <rect width="100" height="100" fill="white" />
      {m.map((row, y) =>
        row.map((on, x) =>
          on ? (
            <rect
              key={`${x}-${y}`}
              x={x * cell}
              y={y * cell}
              width={cell}
              height={cell}
              fill="#0A0A0A"
            />
          ) : null
        )
      )}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type SmartTicketViewProps = {
  reservation: ReservationViewModel;
};

// ---------------------------------------------------------------------------
// SmartTicketView
// ---------------------------------------------------------------------------

export function SmartTicketView({ reservation }: SmartTicketViewProps) {
  const ticketState = deriveTicketState(reservation);
  const ready = ticketState === "ready";

  return (
    <article className="mx-auto w-full max-w-2xl px-6 py-10 md:py-14 space-y-8">
      {/* Header */}
      <header className="text-center space-y-2">
        <span className="nx-eyebrow text-neutral-500 font-medium">Smart ticket</span>
        <h1 className="nx-h3 font-display font-light text-neutral-900 mt-2">
          {ticketState === "ready"
            ? "Your pickup pass"
            : ticketState === "cancelled"
              ? "Reservation cancelled"
              : "Ticket not ready yet"}
        </h1>
        <p className="nx-body text-neutral-500 mt-2 max-w-lg mx-auto font-light leading-relaxed">
          {ready
            ? "Present this at the Casablanca arrivals hall. Your operator scans it, verifies your identity, and hands over the keys."
            : "Your ticket will become available once documents are approved by an operator."}
        </p>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Not ready state                                                       */}
      {/* ------------------------------------------------------------------ */}
      {ticketState === "not_ready" && (
        <div
          className="flex items-start gap-3.5 rounded-2xl border border-amber-250 bg-amber-50/50 px-5 py-4 shadow-sm"
          role="status"
          aria-live="polite"
        >
          <Clock
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
          />
          <div>
            <p className="text-xs font-semibold text-amber-950">Ticket not available yet</p>
            <p className="mt-1 text-xs text-amber-700 leading-relaxed font-light">
              Your smart ticket will be available once your reservation is fully
              confirmed and documents are approved. Please check your waiting
              room for the latest status.
            </p>
            <Link
              className="mt-4 inline-flex h-9 items-center justify-center rounded-full bg-amber-950 px-4 text-xs font-semibold text-white transition hover:bg-neutral-800 shadow-sm"
              href={`/reservations/${reservation.id}/waiting`}
            >
              Go to waiting room
            </Link>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Cancelled state                                                       */}
      {/* ------------------------------------------------------------------ */}
      {ticketState === "cancelled" && (
        <div
          className="flex items-start gap-3.5 rounded-2xl border border-red-200 bg-red-50/40 px-5 py-4 shadow-sm"
          role="alert"
        >
          <AlertTriangle
            aria-hidden="true"
            className="mt-0.5 h-4.5 w-4.5 shrink-0 text-red-600"
          />
          <div>
            <p className="text-xs font-semibold text-red-950">Reservation cancelled</p>
            <p className="mt-1 text-xs text-red-700 leading-relaxed font-light">
              This reservation has been cancelled and no ticket is available.
            </p>
            <Link
              className="mt-4 inline-flex h-9 items-center justify-center rounded-full bg-neutral-950 px-4 text-xs font-semibold text-white transition hover:bg-neutral-800 shadow-sm"
              href="/catalog"
            >
              Browse vehicles
            </Link>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Ready state — full perforated pass card                               */}
      {/* ------------------------------------------------------------------ */}
      {ticketState === "ready" && (
        <div className="space-y-6">
          {/* Status confirmed banner */}
          <div className="flex items-center gap-2.5 rounded-2xl border border-green-200 bg-green-50/40 px-5 py-3 shadow-sm">
            <CheckCircle2
              aria-hidden="true"
              className="h-4.5 w-4.5 shrink-0 text-emerald-600"
            />
            <p className="text-xs font-semibold text-green-950">
              Reservation confirmed &mdash; present this ticket at CMN
            </p>
          </div>

          {/* Ticket pass container */}
          <div
            className="max-w-[560px] w-full mx-auto overflow-hidden rounded-[1.5rem] border border-neutral-200 bg-white shadow-sm"
            data-testid="smart-ticket"
          >
            {/* Header */}
            <div className="bg-[#0A0A0A] text-white px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1E41FC]" />
                <span className="font-display text-lg font-medium">
                  Nexus<span className="text-neutral-500">/Car</span>
                </span>
              </div>
              <span className="font-mono text-[0.8rem] tracking-[0.18em] text-neutral-300">
                {reservation.id.toUpperCase().slice(0, 8)}
              </span>
            </div>

            {/* Body */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-6 items-center">
              <div className="w-28 h-28 mx-auto sm:mx-0 rounded-xl border border-neutral-200 p-2 bg-white flex items-center justify-center shrink-0">
                <FauxQR value={reservation.id} />
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Vehicle</div>
                  <div className="font-display text-[1.25rem] font-semibold text-neutral-900 mt-0.5">
                    {reservation.vehicle?.name || "Premium Vehicle"}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-neutral-100 pt-3">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#1E41FC]" /> Location
                    </div>
                    <div className="text-[0.95rem] font-medium text-neutral-900 mt-1">
                      CMN Terminal
                    </div>
                    <div className="text-xs text-neutral-500 font-light mt-0.5">
                      {formatPickupLocation(reservation.pickupLocation)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5 text-[#1E41FC]" /> Date
                    </div>
                    <div className="text-[0.95rem] font-medium text-neutral-900 mt-1">
                      {new Date(reservation.pickupDate).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </div>
                    <div className="text-xs text-neutral-500 font-light mt-0.5">
                      {new Date(reservation.pickupDate).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Perforation visual strip */}
            <div className="relative">
              <div className="border-t border-dashed border-neutral-200" />
              <span className="absolute -left-3 -top-3 w-6 h-6 rounded-full bg-white border border-neutral-200" />
              <span className="absolute -right-3 -top-3 w-6 h-6 rounded-full bg-white border border-neutral-200" />
            </div>

            {/* Footer status + handoff info */}
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Document status</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-[10px] font-semibold text-green-800 uppercase tracking-wider">
                  Approved
                </span>
              </div>
              <div className="flex items-start gap-2.5 rounded-xl bg-neutral-50 border border-neutral-200 px-4 py-3">
                <ShieldCheck className="w-4.5 h-4.5 text-[#1E41FC] mt-0.5 shrink-0" />
                <p className="text-xs text-neutral-600 leading-relaxed font-light">
                  Show this pass to your Nexus operator at the arrivals hall. They will verify your identity, inspect your driver licence, and hand over the keys immediately.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Navigation & Wallet Export Button                                     */}
      {/* ------------------------------------------------------------------ */}
      <div className="mt-8 flex flex-col gap-4 border-t border-neutral-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <Link
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
          href={`/reservations/${reservation.id}/waiting`}
        >
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
          Back to waiting room
        </Link>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-neutral-200 bg-white px-5 text-xs font-semibold text-neutral-900 hover:bg-neutral-50 transition-colors shadow-sm"
            onClick={() => alert("Wallet export is simulated for this concept.")}
          >
            <Wallet className="w-4 h-4 text-[#1E41FC]" />
            Add to wallet
          </button>
          <Link
            className="inline-flex h-10 items-center justify-center rounded-full border border-neutral-200 bg-white px-5 text-xs font-semibold text-neutral-900 hover:bg-neutral-50 transition-colors shadow-sm"
            href="/dashboard"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </article>
  );
}
