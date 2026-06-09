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
  Ticket,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  CalendarDays,
  Car,
  Clock,
  ArrowLeft,
} from "lucide-react";
import type { ReservationViewModel } from "@/features/reservations/types";
import type { TicketReadyState } from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatEurCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

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

  return (
    <article className="mx-auto w-full max-w-2xl px-6 py-10 md:py-14">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2">
          <Ticket aria-hidden="true" className="h-5 w-5 text-[var(--nx-accent)]" />
          <span className="text-xs font-black uppercase tracking-[0.14em] text-neutral-500">
            Smart ticket
          </span>
        </div>
        <h1 className="mt-3 text-4xl font-black text-neutral-950">
          {ticketState === "ready"
            ? "Your rental ticket"
            : ticketState === "cancelled"
              ? "Reservation cancelled"
              : "Ticket not ready yet"}
        </h1>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Not ready state                                                       */}
      {/* ------------------------------------------------------------------ */}
      {ticketState === "not_ready" && (
        <div
          className="mb-8 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-5 py-4"
          role="status"
          aria-live="polite"
        >
          <Clock
            aria-hidden="true"
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
          />
          <div>
            <p className="font-black text-amber-950">Ticket not available yet</p>
            <p className="mt-1 text-sm text-amber-800">
              Your smart ticket will be available once your reservation is fully
              confirmed and documents are approved. Please check your waiting
              room for the latest status.
            </p>
            <Link
              className="mt-4 inline-flex min-h-10 items-center gap-1.5 rounded-md bg-amber-800 px-5 text-sm font-bold text-white transition hover:bg-amber-900"
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
          className="mb-8 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-5 py-4"
          role="alert"
        >
          <AlertTriangle
            aria-hidden="true"
            className="mt-0.5 h-5 w-5 shrink-0 text-red-600"
          />
          <div>
            <p className="font-black text-red-950">Reservation cancelled</p>
            <p className="mt-1 text-sm text-red-800">
              This reservation has been cancelled and no ticket is available.
            </p>
            <Link
              className="mt-4 inline-flex min-h-10 items-center rounded-md bg-neutral-950 px-5 text-sm font-bold text-white transition hover:bg-neutral-800"
              href="/catalog"
            >
              Browse vehicles
            </Link>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Ready state — full ticket                                             */}
      {/* ------------------------------------------------------------------ */}
      {ticketState === "ready" && (
        <div className="space-y-5">
          {/* Status confirmed banner */}
          <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-5 py-3">
            <CheckCircle2
              aria-hidden="true"
              className="h-5 w-5 shrink-0 text-green-600"
            />
            <p className="text-sm font-black text-green-950">
              Reservation confirmed — present this ticket at the counter
            </p>
          </div>

          {/* Ticket card */}
          <div className="overflow-hidden rounded-lg border border-[var(--nx-line)] bg-white">
            {/* Ticket header */}
            <div className="border-b border-[var(--nx-line)] bg-neutral-950 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-400">
                    Nexus Mobility
                  </p>
                  <p className="mt-1 text-xl font-black text-white">
                    Car Rental Voucher
                  </p>
                  <p className="mt-1 text-xs text-neutral-400">
                    Casablanca Mohammed V Airport
                  </p>
                </div>
                <Ticket
                  aria-hidden="true"
                  className="h-8 w-8 shrink-0 text-neutral-500"
                />
              </div>
            </div>

            {/* Booking reference */}
            <div className="border-b border-dashed border-[var(--nx-line)] px-6 py-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">
                Booking Reference
              </p>
              <p
                className="mt-2 break-all font-mono text-2xl font-black tracking-wider text-neutral-950"
                aria-label={`Booking reference: ${reservation.id}`}
              >
                {reservation.id.toUpperCase().slice(0, 8)}
              </p>
              <p className="mt-1 font-mono text-xs text-neutral-400">
                {reservation.id}
              </p>
            </div>

            {/* Trip details */}
            <div className="grid grid-cols-1 divide-y divide-[var(--nx-line)] px-6 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              {/* Vehicle */}
              {reservation.vehicle && (
                <div className="flex items-start gap-3 py-5 sm:pr-6">
                  <Car
                    aria-hidden="true"
                    className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400"
                  />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">
                      Vehicle
                    </p>
                    <p className="mt-1 text-sm font-black text-neutral-950">
                      {reservation.vehicle.name}
                    </p>
                    {reservation.vehicle.category && (
                      <p className="text-xs text-neutral-500">
                        {reservation.vehicle.category}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Pickup location */}
              <div className="flex items-start gap-3 py-5 sm:pl-6">
                <MapPin
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400"
                />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">
                    Pickup Location
                  </p>
                  <p className="mt-1 text-sm font-black text-neutral-950">
                    CMN — {formatPickupLocation(reservation.pickupLocation)}
                  </p>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 divide-y divide-[var(--nx-line)] border-t border-[var(--nx-line)] px-6 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              <div className="flex items-start gap-3 py-5 sm:pr-6">
                <CalendarDays
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400"
                />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">
                    Pickup Date
                  </p>
                  <p className="mt-1 text-sm font-black text-neutral-950">
                    {formatDate(reservation.pickupDate)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 py-5 sm:pl-6">
                <CalendarDays
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400"
                />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">
                    Return Date
                  </p>
                  <p className="mt-1 text-sm font-black text-neutral-950">
                    {formatDate(reservation.returnDate)}
                  </p>
                </div>
              </div>
            </div>

            {/* Financial summary */}
            <div className="border-t border-[var(--nx-line)] bg-neutral-50 px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">
                    Total ({reservation.totalDays}{" "}
                    {reservation.totalDays === 1 ? "day" : "days"})
                  </p>
                  <p className="mt-1 text-2xl font-black text-neutral-950">
                    €{formatEurCents(reservation.totalPriceEurCents)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">
                    Deposit paid
                  </p>
                  <p className="mt-1 text-sm font-black text-neutral-950">
                    €{formatEurCents(reservation.depositEurCents)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="rounded-lg border border-[var(--nx-line)] bg-[var(--nx-bg-soft)] px-5 py-4">
            <h2 className="text-xs font-black uppercase tracking-[0.14em] text-neutral-500">
              What to do at the counter
            </h2>
            <ol className="mt-3 space-y-2 text-sm text-neutral-700">
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-[10px] font-black text-white">
                  1
                </span>
                Show this screen to the Nexus Mobility agent at CMN.
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-[10px] font-black text-white">
                  2
                </span>
                The agent will verify your identity and booking reference.
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-[10px] font-black text-white">
                  3
                </span>
                Your vehicle will be ready at the indicated pickup terminal.
              </li>
            </ol>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Navigation                                                            */}
      {/* ------------------------------------------------------------------ */}
      <div className="mt-8 flex flex-col gap-3 border-t border-[var(--nx-line)] pt-6 sm:flex-row sm:items-center sm:justify-between">
        <Link
          className="inline-flex items-center gap-1.5 text-sm font-bold text-neutral-950 underline decoration-neutral-400 underline-offset-2 hover:decoration-neutral-950"
          href={`/reservations/${reservation.id}/waiting`}
        >
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
          Waiting room
        </Link>
        <Link
          className="inline-flex min-h-10 items-center rounded-md border border-[var(--nx-line)] bg-white px-5 text-sm font-bold text-neutral-950 transition hover:bg-neutral-50"
          href="/dashboard"
        >
          Dashboard
        </Link>
      </div>
    </article>
  );
}
