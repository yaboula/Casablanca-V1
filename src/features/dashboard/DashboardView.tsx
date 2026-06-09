/**
 * DashboardView — real backend-backed customer dashboard.
 *
 * Server Component — receives pre-fetched DashboardData.
 * No client state, no polling, no local fake data.
 *
 * Layout:
 * 1. Active reservation hero (most recent non-completed/cancelled)
 * 2. Past reservations list
 * 3. Empty state → catalog CTA
 */

import Link from "next/link";
import {
  CalendarDays,
  Car,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Ticket,
  UploadCloud,
  ArrowRight,
  PlusCircle,
} from "lucide-react";
import type { ReservationViewModel } from "@/features/reservations/types";
import type { DashboardData, ReservationNextAction } from "./types";
import { deriveNextAction } from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatEurCents(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}

function statusLabel(status: string): string {
  return status.replace(/_/g, " ");
}

const STATUS_BADGE: Record<
  string,
  { label: string; class: string }
> = {
  PENDING_DEPOSIT: { label: "Awaiting deposit", class: "border-amber-200 bg-amber-50 text-amber-800" },
  AWAITING_CAPTURE: { label: "Processing payment", class: "border-blue-200 bg-blue-50 text-blue-800" },
  CONFIRMED: { label: "Confirmed", class: "border-green-200 bg-green-50 text-green-800" },
  IN_PROGRESS: { label: "Active rental", class: "border-green-200 bg-green-100 text-green-900" },
  COMPLETED: { label: "Completed", class: "border-neutral-200 bg-neutral-50 text-neutral-600" },
  CANCELLED: { label: "Cancelled", class: "border-red-200 bg-red-50 text-red-700" },
};

// ---------------------------------------------------------------------------
// Next action CTA config
// ---------------------------------------------------------------------------

type NextActionCta = {
  label: string;
  href: (id: string) => string;
  icon: typeof ArrowRight;
  variant: "primary" | "secondary";
};

const NEXT_ACTION_CTA: Record<ReservationNextAction, NextActionCta | null> = {
  complete_payment: {
    label: "Complete payment",
    href: (id) => `/reservations/${id}/confirmed`,
    icon: AlertTriangle,
    variant: "primary",
  },
  upload_documents: {
    label: "Upload documents",
    href: (id) => `/reservations/${id}/check-in`,
    icon: UploadCloud,
    variant: "primary",
  },
  await_review: {
    label: "Track review",
    href: (id) => `/reservations/${id}/waiting`,
    icon: Clock,
    variant: "secondary",
  },
  view_ticket: {
    label: "View ticket",
    href: (id) => `/reservations/${id}/ticket`,
    icon: Ticket,
    variant: "primary",
  },
  active: {
    label: "View details",
    href: (id) => `/reservations/${id}/ticket`,
    icon: Car,
    variant: "secondary",
  },
  completed: null,
  cancelled: null,
};

// ---------------------------------------------------------------------------
// ReservationCard
// ---------------------------------------------------------------------------

function ReservationCard({
  reservation,
  isHero = false,
}: {
  reservation: ReservationViewModel;
  isHero?: boolean;
}) {
  const nextAction = deriveNextAction(reservation);
  const cta = NEXT_ACTION_CTA[nextAction];
  const badge = STATUS_BADGE[reservation.status] ?? {
    label: statusLabel(reservation.status),
    class: "border-neutral-200 bg-neutral-50 text-neutral-600",
  };
  const CtaIcon = cta?.icon ?? ArrowRight;

  return (
    <article
      className={`overflow-hidden rounded-lg border border-[var(--nx-line)] bg-white ${
        isHero ? "shadow-sm" : ""
      }`}
    >
      {/* Hero image strip */}
      {isHero && reservation.vehicle?.imageUrl && (
        <div className="h-2 w-full bg-neutral-950" aria-hidden="true" />
      )}

      <div className="px-6 py-5">
        {/* Status + vehicle */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${badge.class}`}
            >
              {badge.label}
            </span>
            <h3
              className={`mt-2 font-black text-neutral-950 ${
                isHero ? "text-xl" : "text-base"
              }`}
            >
              {reservation.vehicle?.name ?? "Vehicle"}
            </h3>
            {reservation.vehicle?.category && (
              <p className="mt-0.5 text-xs text-neutral-500">
                {reservation.vehicle.category}
              </p>
            )}
          </div>
          {isHero && (
            <div className="shrink-0 text-right">
              <p className="text-xs text-neutral-500">Total</p>
              <p className="text-xl font-black text-neutral-950">
                {formatEurCents(reservation.totalPriceEurCents)}
              </p>
            </div>
          )}
        </div>

        {/* Trip dates */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-neutral-600">
          <div className="flex items-center gap-1.5">
            <CalendarDays aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
            <span>
              {formatDate(reservation.pickupDate)} →{" "}
              {formatDate(reservation.returnDate)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
            <span>
              {reservation.totalDays}{" "}
              {reservation.totalDays === 1 ? "day" : "days"}
            </span>
          </div>
        </div>

        {/* Booking ref */}
        <p className="mt-2 font-mono text-xs text-neutral-400">
          {reservation.id.toUpperCase().slice(0, 8)} &middot;{" "}
          {formatDate(reservation.createdAt)}
        </p>

        {/* Next action CTA */}
        {cta && (
          <div className="mt-5">
            <Link
              href={cta.href(reservation.id)}
              className={`inline-flex min-h-10 items-center gap-2 rounded-md px-5 text-sm font-bold transition ${
                cta.variant === "primary"
                  ? "bg-neutral-950 text-white hover:bg-neutral-800"
                  : "border border-[var(--nx-line)] bg-white text-neutral-950 hover:bg-neutral-50"
              }`}
            >
              <CtaIcon aria-hidden="true" className="h-4 w-4" />
              {cta.label}
              <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type DashboardViewProps = {
  userName: string;
  data: DashboardData;
};

// ---------------------------------------------------------------------------
// DashboardView
// ---------------------------------------------------------------------------

export function DashboardView({ userName, data }: DashboardViewProps) {
  const { reservations } = data;

  const activeStatuses = new Set([
    "PENDING_DEPOSIT",
    "AWAITING_CAPTURE",
    "CONFIRMED",
    "IN_PROGRESS",
  ]);

  const activeReservations = reservations.filter((r) =>
    activeStatuses.has(r.status),
  );
  const pastReservations = reservations.filter(
    (r) => !activeStatuses.has(r.status),
  );

  const heroReservation = activeReservations[0] ?? null;

  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-10 md:py-14">
      {/* Page header */}
      <header className="mb-10 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-neutral-500">
            Customer dashboard
          </p>
          <h1 className="mt-2 text-4xl font-black text-neutral-950">
            Welcome back{userName ? `, ${userName.split(" ")[0]}` : ""}
          </h1>
        </div>
        <Link
          className="inline-flex min-h-11 items-center gap-2 rounded-md bg-neutral-950 px-5 text-sm font-bold text-white transition hover:bg-neutral-800"
          href="/catalog"
        >
          <PlusCircle aria-hidden="true" className="h-4 w-4" />
          Book a vehicle
        </Link>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Empty state                                                           */}
      {/* ------------------------------------------------------------------ */}
      {reservations.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-[var(--nx-line)] bg-white py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
            <Car aria-hidden="true" className="h-8 w-8 text-neutral-400" />
          </div>
          <h2 className="mt-6 text-xl font-black text-neutral-950">
            No reservations yet
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-neutral-600">
            Browse our fleet and book your vehicle for pickup at Casablanca
            Mohammed V Airport.
          </p>
          <Link
            className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-md bg-neutral-950 px-6 font-bold text-white transition hover:bg-neutral-800"
            href="/catalog"
          >
            Browse vehicles
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Hero active reservation                                              */}
      {/* ------------------------------------------------------------------ */}
      {heroReservation && (
        <div className="mb-10">
          <h2 className="mb-4 text-xs font-black uppercase tracking-[0.14em] text-neutral-500">
            Current reservation
          </h2>
          <ReservationCard reservation={heroReservation} isHero />

          {/* Other active reservations */}
          {activeReservations.length > 1 && (
            <div className="mt-4 space-y-4">
              {activeReservations.slice(1).map((r) => (
                <ReservationCard key={r.id} reservation={r} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Past reservations                                                     */}
      {/* ------------------------------------------------------------------ */}
      {pastReservations.length > 0 && (
        <div>
          <h2 className="mb-4 text-xs font-black uppercase tracking-[0.14em] text-neutral-500">
            Past reservations
          </h2>
          <div className="space-y-4">
            {pastReservations.map((r) => (
              <ReservationCard key={r.id} reservation={r} />
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Book again CTA (if has past reservations)                            */}
      {/* ------------------------------------------------------------------ */}
      {pastReservations.length > 0 && (
        <div className="mt-10 flex items-center justify-center rounded-lg border border-[var(--nx-line)] bg-[var(--nx-bg-soft)] px-6 py-8">
          <div className="text-center">
            <CheckCircle2
              aria-hidden="true"
              className="mx-auto h-8 w-8 text-neutral-400"
            />
            <h2 className="mt-4 text-lg font-black text-neutral-950">
              Ready for your next trip?
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              Browse our fleet and book again at CMN.
            </p>
            <Link
              className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-md bg-neutral-950 px-6 font-bold text-white transition hover:bg-neutral-800"
              href="/catalog"
            >
              Browse fleet
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
