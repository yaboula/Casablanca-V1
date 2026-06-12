/**
 * DashboardView — Trip control center.
 *
 * Server Component — receives pre-fetched DashboardData.
 * No client state, no polling, no local fake data.
 *
 * Hierarchy:
 * 1. Top action banner (if any reservation needs attention)
 * 2. Active / needs-attention reservations (hero + list)
 * 3. In review reservations
 * 4. Upcoming confirmed
 * 5. Cancelled
 * 6. Past / completed
 * 7. Browse fleet CTA
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
  MapPin,
  CalendarDays,
  CreditCard,
  FileText,
  ChevronRight,
} from "lucide-react";
import type { ReservationViewModel } from "@/features/reservations/types";
import type { DashboardData, ReservationNextAction } from "./types";
import { deriveNextAction } from "./types";
import { CancelReservationButton } from "./CancelReservationButton";

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

function formatDateShort(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return iso;
  }
}

function formatEurCents(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}

// ---------------------------------------------------------------------------
// Status configuration — customer-facing language
// ---------------------------------------------------------------------------

const STATUS_BADGE: Record<string, { label: string; class: string }> = {
  PENDING_DEPOSIT:  { label: "Payment needed",    class: "border-amber-200 bg-amber-50 text-amber-800" },
  AWAITING_CAPTURE: { label: "Processing payment", class: "border-blue-200 bg-blue-50 text-blue-800" },
  CONFIRMED:        { label: "Confirmed",          class: "border-green-200 bg-green-50 text-green-800" },
  IN_PROGRESS:      { label: "Active rental",      class: "border-emerald-200 bg-emerald-50 text-emerald-900" },
  COMPLETED:        { label: "Completed",          class: "border-neutral-200 bg-neutral-50 text-neutral-500" },
  CANCELLED:        { label: "Cancelled",          class: "border-red-200 bg-red-50 text-red-700" },
};

// ---------------------------------------------------------------------------
// Next action CTA config
// ---------------------------------------------------------------------------

type NextActionCta = {
  label: string;
  href: (id: string) => string;
  icon: typeof ArrowRight;
  variant: "primary" | "secondary" | "warning";
  rowText: string;
};

const NEXT_ACTION_CTA: Record<ReservationNextAction, NextActionCta | null> = {
  complete_payment: {
    label: "Complete payment",
    href: (id) => `/reservations/${id}/confirmed`,
    icon: CreditCard,
    variant: "warning",
    rowText: "Complete payment",
  },
  upload_documents: {
    label: "Upload documents",
    href: (id) => `/reservations/${id}/check-in`,
    icon: UploadCloud,
    variant: "primary",
    rowText: "Upload documents",
  },
  await_review: {
    label: "Track review status",
    href: (id) => `/reservations/${id}/waiting`,
    icon: Clock,
    variant: "secondary",
    rowText: "Documents under review",
  },
  view_ticket: {
    label: "View pickup ticket",
    href: (id) => `/reservations/${id}/ticket`,
    icon: Ticket,
    variant: "primary",
    rowText: "View pickup ticket",
  },
  active: {
    label: "View active rental",
    href: (id) => `/reservations/${id}/ticket`,
    icon: Car,
    variant: "secondary",
    rowText: "View active rental",
  },
  completed: null,
  cancelled: null,
};

// ---------------------------------------------------------------------------
// Journey mini progress bar
// ---------------------------------------------------------------------------

function JourneyProgress({ status }: { status: string }) {
  const steps = [
    { label: "Reserved", done: true },
    {
      label: "Verified",
      done: status === "CONFIRMED" || status === "IN_PROGRESS" || status === "COMPLETED",
      active: status === "PENDING_DEPOSIT" || status === "AWAITING_CAPTURE",
    },
    {
      label: "Pickup",
      done: status === "IN_PROGRESS" || status === "COMPLETED",
      active: status === "CONFIRMED",
    },
  ];

  return (
    <div className="flex items-center gap-1" aria-label="Journey progress">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center gap-1">
          <div
            className={[
              "flex h-5 items-center gap-1 rounded-full px-2 text-[10px] font-semibold",
              step.done
                ? "bg-green-100 text-green-700"
                : step.active
                ? "bg-amber-100 text-amber-700"
                : "bg-neutral-100 text-neutral-400",
            ].join(" ")}
          >
            {step.done ? (
              <CheckCircle2 className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
            ) : step.active ? (
              <Clock className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
            ) : (
              <div className="h-2 w-2 shrink-0 rounded-full border border-current opacity-50" aria-hidden="true" />
            )}
            {step.label}
          </div>
          {i < steps.length - 1 && (
            <div className={["h-px w-3", step.done ? "bg-green-300" : "bg-neutral-200"].join(" ")} aria-hidden="true" />
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Action required banner
// ---------------------------------------------------------------------------

function ActionBanner({ reservation }: { reservation: ReservationViewModel }) {
  const nextAction = deriveNextAction(reservation);
  const cta = NEXT_ACTION_CTA[nextAction];
  if (!cta) return null;

  const isPayment = nextAction === "complete_payment";
  const vehicleName = reservation.vehicle?.name ?? "your vehicle";
  const ref = reservation.id.toUpperCase().slice(0, 8);

  return (
    <div
      className={[
        "rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4",
        isPayment
          ? "border-amber-200 bg-amber-50"
          : "border-blue-200 bg-blue-50",
      ].join(" ")}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div
          className={[
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
            isPayment ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700",
          ].join(" ")}
        >
          {isPayment ? (
            <CreditCard className="h-4 w-4" aria-hidden="true" />
          ) : (
            <FileText className="h-4 w-4" aria-hidden="true" />
          )}
        </div>
        <div>
          <p className={["text-xs font-bold uppercase tracking-wider", isPayment ? "text-amber-800" : "text-blue-800"].join(" ")}>
            Action required
          </p>
          <p className="mt-0.5 text-sm font-semibold text-neutral-900">
            {isPayment
              ? `Complete payment to secure ${vehicleName}`
              : nextAction === "upload_documents"
              ? `Upload documents for ${vehicleName}`
              : `${vehicleName} — ${cta.rowText}`}
          </p>
          <p className="mt-0.5 text-xs text-neutral-600 font-light">
            Ref: {ref}
            {isPayment && " · Vehicle held, pickup locked until payment is authorized"}
          </p>
        </div>
      </div>
      <Link
        href={cta.href(reservation.id)}
        aria-label={`${cta.label} for ${vehicleName}`}
        className="inline-flex shrink-0 h-10 items-center gap-2 rounded-full bg-neutral-950 px-5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-neutral-800"
      >
        {cta.label}
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hero active reservation card
// ---------------------------------------------------------------------------

function HeroCard({ reservation }: { reservation: ReservationViewModel }) {
  const nextAction = deriveNextAction(reservation);
  const cta = NEXT_ACTION_CTA[nextAction];
  const badge = STATUS_BADGE[reservation.status] ?? {
    label: reservation.status,
    class: "border-neutral-200 bg-neutral-50 text-neutral-600",
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-[1.5rem] overflow-hidden shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.1fr]">
        {/* Vehicle image */}
        <div className="relative aspect-[16/10] md:aspect-auto md:min-h-[260px] bg-neutral-100 overflow-hidden">
          {reservation.vehicle?.imageUrl ? (
            <img
              src={reservation.vehicle.imageUrl}
              alt={reservation.vehicle.name ?? "Vehicle"}
              className="absolute inset-0 w-full h-full object-cover"
              loading="eager"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-neutral-300">
              <Car className="w-12 h-12 stroke-1" aria-hidden="true" />
            </div>
          )}
          <div className="absolute top-4 left-4">
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${badge.class}`}>
              {badge.label}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="p-6 md:p-8 flex flex-col justify-between gap-5">
          <div className="space-y-4">
            <div>
              {reservation.vehicle?.category && (
                <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">
                  {reservation.vehicle.category} class · Ref: {reservation.id.toUpperCase().slice(0, 8)}
                </p>
              )}
              <h3 className="mt-1 text-2xl font-bold tracking-tight text-neutral-950">
                {reservation.vehicle?.name ?? "Premium Vehicle"}
              </h3>
            </div>

            {/* Journey progress */}
            <JourneyProgress status={reservation.status} />

            {/* Details grid */}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4 border-t border-neutral-100 pt-4">
              <div>
                <dt className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-neutral-400">
                  <MapPin className="h-2.5 w-2.5" aria-hidden="true" />
                  Pickup
                </dt>
                <dd className="mt-1 text-sm font-semibold text-neutral-950">
                  {formatDateShort(reservation.pickupDate)}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-neutral-400">
                  <MapPin className="h-2.5 w-2.5" aria-hidden="true" />
                  Terminal
                </dt>
                <dd className="mt-1 text-sm font-semibold text-neutral-950">
                  CMN · {reservation.pickupLocation === "CMN_T1" ? "Terminal 1" : "Terminal 2"}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-neutral-400">
                  <CalendarDays className="h-2.5 w-2.5" aria-hidden="true" />
                  Duration
                </dt>
                <dd className="mt-1 text-sm font-semibold text-neutral-950">
                  {reservation.totalDays} {reservation.totalDays === 1 ? "day" : "days"}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-neutral-400">
                  <CreditCard className="h-2.5 w-2.5" aria-hidden="true" />
                  Total
                </dt>
                <dd className="mt-1 text-sm font-semibold text-neutral-950">
                  {formatEurCents(reservation.totalPriceEurCents)}
                </dd>
              </div>
            </dl>
          </div>

          {cta && (
            <div className="pt-4 border-t border-neutral-100 flex items-center gap-3">
              <Link
                href={cta.href(reservation.id)}
                aria-label={`${cta.label} for ${reservation.vehicle?.name ?? "this vehicle"}`}
                className={[
                  "inline-flex h-11 items-center gap-2 rounded-full px-6 text-xs font-bold uppercase tracking-wider transition",
                  cta.variant === "warning"
                    ? "bg-neutral-950 text-white hover:bg-amber-600"
                    : cta.variant === "primary"
                    ? "bg-neutral-950 text-white hover:bg-[#1E41FC]"
                    : "border border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50 shadow-sm",
                ].join(" ")}
              >
                <cta.icon aria-hidden="true" className="h-4 w-4" />
                {cta.label}
                <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
              </Link>

              {/* Show cancel button only for pending payment reservations */}
              {(reservation.status === "PENDING_DEPOSIT" || reservation.status === "AWAITING_CAPTURE") && (
                <CancelReservationButton reservationId={reservation.id} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reservation row (list item)
// ---------------------------------------------------------------------------

function ReservationRow({ reservation }: { reservation: ReservationViewModel }) {
  const nextAction = deriveNextAction(reservation);
  const cta = NEXT_ACTION_CTA[nextAction];
  const badge = STATUS_BADGE[reservation.status] ?? {
    label: reservation.status,
    class: "border-neutral-200 bg-neutral-50 text-neutral-600",
  };
  const vehicleName = reservation.vehicle?.name ?? "Vehicle";
  const href = cta ? cta.href(reservation.id) : `/reservations/${reservation.id}/confirmed`;
  const ariaLabel = cta
    ? `${cta.rowText} — ${vehicleName}`
    : `View reservation — ${vehicleName}`;

  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white px-5 py-4 hover:border-neutral-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-center gap-4">
        {/* Thumbnail */}
        <div className="w-16 h-11 rounded-xl border border-neutral-100 overflow-hidden bg-neutral-50 shrink-0">
          {reservation.vehicle?.imageUrl ? (
            <img
              src={reservation.vehicle.imageUrl}
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Car className="w-5 h-5 text-neutral-400 stroke-1" aria-hidden="true" />
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <h3 className="text-sm font-semibold text-neutral-950">{vehicleName}</h3>
          <p className="text-xs text-neutral-500 font-light mt-0.5">
            {formatDate(reservation.pickupDate)} · Ref: {reservation.id.toUpperCase().slice(0, 8)}
          </p>
          {/* Next action hint text */}
          {cta && (
            <p className="text-xs font-medium text-[#1E41FC] mt-1">{cta.rowText}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 self-end sm:self-auto">
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${badge.class}`}>
          {badge.label}
        </span>
        <div
          aria-hidden="true"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 group-hover:border-neutral-400 group-hover:text-neutral-900 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={`section-${title.toLowerCase().replace(/\s+/g, "-")}`} className="space-y-3">
      <h2
        id={`section-${title.toLowerCase().replace(/\s+/g, "-")}`}
        className="text-[10px] font-bold uppercase tracking-widest text-neutral-400"
      >
        {title}
      </h2>
      {children}
    </section>
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
  const firstName = userName ? userName.split(" ")[0] : "";

  // ---------------------------------------------------------------------------
  // Grouping — status-aware
  // ---------------------------------------------------------------------------
  const needsAttention = reservations.filter((r) =>
    r.status === "PENDING_DEPOSIT" || r.status === "AWAITING_CAPTURE",
  );
  const inReview = reservations.filter(
    (r) => r.status === "CONFIRMED" && !r.hasQrCode,
  );
  const readyForPickup = reservations.filter(
    (r) => r.status === "CONFIRMED" && r.hasQrCode,
  );
  const active = reservations.filter((r) => r.status === "IN_PROGRESS");
  // Cancelled: only future-dated or no pickup date match; kept separate
  const cancelled = reservations.filter((r) => r.status === "CANCELLED");
  const completed = reservations.filter((r) => r.status === "COMPLETED");

  // Priority hero: first from needsAttention, then active, then readyForPickup, then inReview
  const heroCandidate =
    needsAttention[0] ?? active[0] ?? readyForPickup[0] ?? inReview[0] ?? null;

  const hasUrgentAction = needsAttention.length > 0;

  // Subtitle copy
  let headerSubtitle: string;
  if (needsAttention.length > 0) {
    const v = needsAttention[0].vehicle?.name ?? "your reservation";
    headerSubtitle = `${v} needs payment authorization before pickup can be confirmed.`;
  } else if (active.length > 0) {
    headerSubtitle = "Your rental is currently active. Have a great trip!";
  } else if (readyForPickup.length > 0) {
    headerSubtitle = "Your smart ticket is ready. Check pickup details below.";
  } else if (inReview.length > 0) {
    headerSubtitle = "Documents are under review. This page updates automatically.";
  } else {
    headerSubtitle = "Manage payment, documents, and pickup status from one place.";
  }

  return (
    <section className="nx-container py-10 md:py-14 max-w-[1080px]">
      <div className="space-y-8">

        {/* ------------------------------------------------------------------ */}
        {/* Page header                                                          */}
        {/* ------------------------------------------------------------------ */}
        <header className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <span className="nx-eyebrow text-neutral-500 font-medium">My trips</span>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-neutral-950">
              Welcome back{firstName ? `, ${firstName}` : ""}.
            </h1>
            <p className="mt-2 max-w-lg text-sm text-neutral-600 font-light leading-relaxed">
              {headerSubtitle}
            </p>
          </div>
          <div className="flex items-center gap-3 self-start mt-1">
            <Link
              href="/history"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-neutral-200 bg-white px-6 text-xs font-bold uppercase tracking-wider text-neutral-600 transition hover:border-neutral-300 hover:bg-neutral-50 shadow-sm"
            >
              Trips history
            </Link>
            
            {/* Book another vehicle — secondary priority when actions pending */}
            <Link
              className={[
                "inline-flex h-11 items-center gap-2 rounded-full px-6 text-xs font-bold uppercase tracking-wider transition",
                hasUrgentAction
                  ? "border border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50 shadow-sm"
                  : "bg-neutral-950 text-white hover:bg-[#1E41FC]",
              ].join(" ")}
              href="/catalog"
            >
              <PlusCircle aria-hidden="true" className="h-4 w-4" />
              Book another vehicle
            </Link>
          </div>
        </header>

        {/* ------------------------------------------------------------------ */}
        {/* Empty state                                                          */}
        {/* ------------------------------------------------------------------ */}
        {reservations.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-neutral-200 bg-white py-20 text-center shadow-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-50 border border-neutral-100">
              <Car aria-hidden="true" className="h-7 w-7 text-neutral-400 stroke-1" />
            </div>
            <h2 className="mt-6 text-xl font-bold text-neutral-950">
              No reservations yet
            </h2>
            <p className="mt-2 max-w-sm text-xs leading-relaxed text-neutral-500 font-light">
              When you reserve a vehicle, your trip, documents, and smart ticket will appear here.
            </p>
            <Link
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-neutral-950 px-6 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#1E41FC]"
              href="/catalog"
            >
              Browse the fleet
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        )}

        {reservations.length > 0 && (
          <>
            {/* ---------------------------------------------------------------- */}
            {/* Action required banner                                            */}
            {/* ---------------------------------------------------------------- */}
            {needsAttention.length > 0 && (
              <div className="space-y-3">
                {needsAttention.map((r) => (
                  <ActionBanner key={r.id} reservation={r} />
                ))}
              </div>
            )}

            {/* ---------------------------------------------------------------- */}
            {/* Hero card — most urgent / active reservation                     */}
            {/* ---------------------------------------------------------------- */}
            {heroCandidate && (
              <Section title={
                heroCandidate.status === "IN_PROGRESS"
                  ? "Active rental"
                  : heroCandidate.status === "PENDING_DEPOSIT" || heroCandidate.status === "AWAITING_CAPTURE"
                  ? "Reservation awaiting payment"
                  : heroCandidate.hasQrCode
                  ? "Ready for pickup"
                  : "Current reservation"
              }>
                <HeroCard reservation={heroCandidate} />

                {/* Secondary items from same category (needs attention group) */}
                {needsAttention.length > 1 && (
                  <div className="space-y-3">
                    {needsAttention.slice(1).map((r) => (
                      <ReservationRow key={r.id} reservation={r} />
                    ))}
                  </div>
                )}
              </Section>
            )}

            {/* ---------------------------------------------------------------- */}
            {/* In review                                                         */}
            {/* ---------------------------------------------------------------- */}
            {inReview.length > 0 && (
              <Section title="Documents in review">
                <div className="space-y-3">
                  {inReview.map((r) => (
                    <ReservationRow key={r.id} reservation={r} />
                  ))}
                </div>
              </Section>
            )}

            {/* ---------------------------------------------------------------- */}
            {/* Ready for pickup                                                  */}
            {/* ---------------------------------------------------------------- */}
            {readyForPickup.length > 0 && heroCandidate?.id !== readyForPickup[0]?.id && (
              <Section title="Ready for pickup">
                <div className="space-y-3">
                  {readyForPickup.map((r) => (
                    <ReservationRow key={r.id} reservation={r} />
                  ))}
                </div>
              </Section>
            )}

            {/* ---------------------------------------------------------------- */}
            {/* Active rentals (if not already hero)                             */}
            {/* ---------------------------------------------------------------- */}
            {active.length > 0 && heroCandidate?.id !== active[0]?.id && (
              <Section title="Active rental">
                <div className="space-y-3">
                  {active.map((r) => (
                    <ReservationRow key={r.id} reservation={r} />
                  ))}
                </div>
              </Section>
            )}

            {/* ---------------------------------------------------------------- */}
            {/* Support strip                                                     */}
            {/* ---------------------------------------------------------------- */}
            <div className="flex items-start gap-3 rounded-2xl bg-neutral-50 border border-neutral-100 px-5 py-4">
              <LifeBuoy className="w-5 h-5 text-neutral-400 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-xs text-neutral-600 font-light leading-relaxed">
                <span className="font-semibold text-neutral-900">Need help with a trip?</span>{" "}
                Open the reservation and use the support option inside. Our team reviews requests as quickly as possible.
              </p>
            </div>

            {/* ---------------------------------------------------------------- */}
            {/* Removed bottom history link since it's in the header now */}

            {/* ---------------------------------------------------------------- */}
            {/* Browse fleet CTA — only when no urgent actions                    */}
            {/* ---------------------------------------------------------------- */}
            <div
              className={[
                "flex items-center justify-center rounded-3xl border px-6 py-8",
                hasUrgentAction ? "border-neutral-100 bg-neutral-50/50" : "border-neutral-200 bg-white shadow-sm",
              ].join(" ")}
            >
              <div className="text-center space-y-3">
                <h2 className={["font-bold", hasUrgentAction ? "text-base text-neutral-500" : "text-lg text-neutral-950"].join(" ")}>
                  Ready for your next trip?
                </h2>
                <p className="text-xs text-neutral-500 font-light">
                  Browse our fleet and book at Casablanca Mohammed V Airport.
                </p>
                <Link
                  className={[
                    "inline-flex h-10 items-center gap-2 rounded-full px-5 text-xs font-bold uppercase tracking-wider transition",
                    hasUrgentAction
                      ? "border border-neutral-200 bg-white text-neutral-600 hover:text-neutral-950"
                      : "bg-neutral-950 text-white hover:bg-[#1E41FC] shadow-sm",
                  ].join(" ")}
                  href="/catalog"
                >
                  Browse fleet
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
