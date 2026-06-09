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
  Car,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Ticket,
  UploadCloud,
  ArrowRight,
  PlusCircle,
  LifeBuoy,
} from "lucide-react";
import type { ReservationViewModel } from "@/features/reservations/types";
import type { DashboardData, ReservationNextAction } from "./types";
import { deriveNextAction } from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
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

  if (isHero) {
    return (
      <div className="bg-white border border-neutral-200 rounded-[1.5rem] overflow-hidden shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr]">
          <div className="relative aspect-[16/10] md:aspect-auto md:min-h-[280px] bg-neutral-50 border-r border-neutral-100 overflow-hidden">
            {reservation.vehicle?.imageUrl ? (
              <img
                src={reservation.vehicle.imageUrl}
                alt={reservation.vehicle.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-neutral-400">
                <Car className="w-10 h-10 stroke-1" />
              </div>
            )}
            <div className="absolute top-4 left-4">
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${badge.class}`}>
                {badge.label}
              </span>
            </div>
          </div>
          <div className="p-6 md:p-8 flex flex-col justify-between">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">
                {reservation.vehicle?.category} Class &middot; Ref: {reservation.id.toUpperCase().slice(0, 8)}
              </div>
              <h3 className="nx-h3 font-display font-light text-neutral-900 mt-2">
                {reservation.vehicle?.name}
              </h3>

              <div className="mt-5 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <dt className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">Pickup</dt>
                  <dd className="text-sm font-semibold text-neutral-900 mt-1">
                    {formatDate(reservation.pickupDate)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">Location</dt>
                  <dd className="text-sm font-semibold text-neutral-900 mt-1">
                    CMN &middot; Terminal {reservation.pickupLocation === "CMN_T1" ? "1" : "2"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">Total Price</dt>
                  <dd className="text-sm font-semibold text-neutral-900 mt-1">
                    {formatEurCents(reservation.totalPriceEurCents)}
                  </dd>
                </div>
              </div>
            </div>

            {cta && (
              <div className="mt-7 pt-4 border-t border-neutral-150">
                <Link
                  href={cta.href(reservation.id)}
                  className={`nx-btn-primary inline-flex h-11 items-center gap-2 rounded-full px-6 text-xs font-bold uppercase tracking-wider transition ${
                    cta.variant === "primary"
                      ? "bg-neutral-950 text-white hover:bg-[#1E41FC]"
                      : "border border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50 shadow-sm"
                  }`}
                >
                  <CtaIcon aria-hidden="true" className="h-4 w-4" />
                  {cta.label}
                  <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Past trips row layout
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white px-5 py-4 hover:border-neutral-350 transition-colors shadow-sm">
      <div className="flex items-center gap-4">
        <div className="w-16 h-11 rounded-xl border border-neutral-100 overflow-hidden bg-neutral-50 shrink-0 relative flex items-center justify-center">
          {reservation.vehicle?.imageUrl ? (
            <img
              src={reservation.vehicle.imageUrl}
              alt={reservation.vehicle.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Car className="w-5 h-5 text-neutral-400 stroke-1" />
          )}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-neutral-950">
            {reservation.vehicle?.name || "Vehicle"}
          </h3>
          <p className="nx-meta text-neutral-500 font-light mt-0.5">
            Ref: {reservation.id.toUpperCase().slice(0, 8)} &middot; {formatDate(reservation.pickupDate)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 self-end sm:self-auto">
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${badge.class}`}>
          {badge.label}
        </span>
        <Link
          href={`/reservations/${reservation.id}/confirmed`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 hover:text-neutral-900 hover:border-neutral-450 transition-colors shadow-sm"
        >
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
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
    <section className="nx-container py-10 md:py-14 space-y-8 max-w-[1000px]">
      {/* Page header */}
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <span className="nx-eyebrow text-neutral-500 font-medium">Customer dashboard</span>
          <h1 className="nx-h2 font-display font-light text-neutral-900 mt-2">
            Welcome back{userName ? `, ${userName.split(" ")[0]}` : ""}
          </h1>
        </div>
        <Link
          className="nx-btn-primary inline-flex h-11 items-center gap-2 rounded-full bg-neutral-950 px-6 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#1E41FC]"
          href="/catalog"
        >
          <PlusCircle aria-hidden="true" className="h-4 w-4" />
          Book another vehicle
        </Link>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Empty state                                                           */}
      {/* ------------------------------------------------------------------ */}
      {reservations.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-neutral-200 bg-white py-20 text-center shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-50 border border-neutral-150">
            <Car aria-hidden="true" className="h-7 w-7 text-neutral-400 stroke-1" />
          </div>
          <h2 className="mt-6 text-xl font-display font-semibold text-neutral-950">
            No active reservation
          </h2>
          <p className="mt-2 max-w-sm text-xs leading-relaxed text-neutral-500 font-light">
            When you reserve a vehicle, your trip, documents and smart ticket will appear here.
          </p>
          <Link
            className="mt-6 nx-btn-primary inline-flex h-11 items-center gap-2 rounded-full bg-[#0a0a0a] px-6 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#1E41FC]"
            href="/catalog"
          >
            Browse the fleet
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Hero active reservation                                              */}
      {/* ------------------------------------------------------------------ */}
      {heroReservation && (
        <div className="space-y-4">
          <h2 className="nx-label text-neutral-400">Current reservation</h2>
          <ReservationCard reservation={heroReservation} isHero />

          {/* Other active reservations */}
          {activeReservations.length > 1 && (
            <div className="space-y-3">
              {activeReservations.slice(1).map((r) => (
                <ReservationCard key={r.id} reservation={r} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Support                                                               */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-start gap-3 rounded-2xl bg-neutral-50 border border-neutral-200 px-5 py-4 text-xs">
        <LifeBuoy className="w-5 h-5 text-[#1E41FC] shrink-0 mt-0.5" />
        <p className="text-neutral-600 font-light leading-relaxed">
          Questions about your trip? Your concierge is available 24/7 at{" "}
          <span className="font-semibold text-neutral-900">concierge@nexuscar.demo</span>.
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Past reservations                                                     */}
      {/* ------------------------------------------------------------------ */}
      {pastReservations.length > 0 && (
        <div className="space-y-4">
          <h2 className="nx-label text-neutral-400">Past reservations</h2>
          <div className="space-y-3">
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
        <div className="flex items-center justify-center rounded-3xl border border-neutral-200 bg-neutral-50/50 px-6 py-8">
          <div className="text-center space-y-4">
            <CheckCircle2
              aria-hidden="true"
              className="mx-auto h-8 w-8 text-neutral-400 stroke-1"
            />
            <div>
              <h2 className="text-lg font-display font-semibold text-neutral-950">
                Ready for your next trip?
              </h2>
              <p className="text-xs text-neutral-500 font-light mt-1">
                Browse our fleet and book again at CMN airport.
              </p>
            </div>
            <Link
              className="nx-btn-primary inline-flex h-11 items-center gap-2 rounded-full bg-neutral-950 px-6 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#1E41FC] shadow-sm"
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
