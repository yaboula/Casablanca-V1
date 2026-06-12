/**
 * ConfirmationView — step 2 (Verify) of Reserve → Verify → Pickup.
 *
 * Wrapped by JourneyShell which provides the shared header + navigable stepper.
 * This component renders only the content section.
 *
 * Payment state rules:
 * - PENDING_DEPOSIT: show Stripe deposit panel only when a transient client secret is available
 * - PENDING_DEPOSIT + no secret: show an honest recovery state
 * - AWAITING_CAPTURE: show processing state
 * - CONFIRMED: show "upload documents" CTA
 * - CANCELLED: show cancellation state
 */

import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  CalendarDays,
  MapPin,
  Car,
  CreditCard,
  Check,
  ArrowRight,
} from "lucide-react";
import type {
  ReservationPaymentIntentRecoveryViewModel,
  ReservationViewModel,
} from "./types";
import { PaymentPanelLoader } from "@/features/payments/PaymentPanelLoader";
import { JourneyShell } from "./JourneyShell";
import type { JourneyStepKey } from "./JourneyShell";

type ConfirmationViewProps = {
  reservation: ReservationViewModel;
  paymentRecovery: ReservationPaymentIntentRecoveryViewModel | null;
};

// ─── Status → shell heading/subtitle config ───────────────────────────────────

type StatusConfig = {
  step: JourneyStepKey;
  heading: string;
  subtitle: string;
  badgeClass: string;
  badgeText: string;
};

function getStatusConfig(status: ReservationViewModel["status"]): StatusConfig {
  switch (status) {
    case "PENDING_DEPOSIT":
      return {
        step: "verify",
        heading: "Verify your reservation.",
        subtitle:
          "Your vehicle is held. Authorize the checkout hold, then upload your documents before arrival.",
        badgeClass: "border-amber-200 bg-amber-50/50 text-amber-800",
        badgeText: "Awaiting verification",
      };
    case "AWAITING_CAPTURE":
      return {
        step: "verify",
        heading: "Processing authorization.",
        subtitle:
          "Authorization received. We are confirming your payment status — this usually takes a few seconds.",
        badgeClass: "border-blue-200 bg-blue-50/50 text-blue-800",
        badgeText: "Processing",
      };
    case "CONFIRMED":
      return {
        step: "verify",
        heading: "Payment verified.",
        subtitle:
          "Checkout hold authorized. Upload your documents to complete check-in and prepare pickup.",
        badgeClass: "border-emerald-200 bg-emerald-50/40 text-emerald-800",
        badgeText: "Payment verified",
      };
    case "IN_PROGRESS":
      return {
        step: "pickup",
        heading: "Rental in progress.",
        subtitle: "The keys have been handed over. Drive safely and enjoy your trip.",
        badgeClass: "border-neutral-200 bg-neutral-50 text-neutral-800",
        badgeText: "In progress",
      };
    case "COMPLETED":
      return {
        step: "pickup",
        heading: "Rental completed.",
        subtitle: "Thank you for renting with Nexus Mobility.",
        badgeClass: "border-neutral-200 bg-neutral-50 text-neutral-500",
        badgeText: "Completed",
      };
    case "CANCELLED":
      return {
        step: "verify",
        heading: "Reservation cancelled.",
        subtitle:
          "This reservation has been cancelled. If you have questions, contact our operations desk.",
        badgeClass: "border-red-200 bg-red-50/50 text-red-800",
        badgeText: "Cancelled",
      };
    default:
      return {
        step: "verify",
        heading: "Reservation status.",
        subtitle: "Please review your rental details below.",
        badgeClass: "border-neutral-200 bg-neutral-50 text-neutral-700",
        badgeText: status,
      };
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TERMINAL_LABELS: Record<string, string> = {
  CMN_T1: "Terminal 1 arrivals (CMN T1)",
  CMN_T2: "Terminal 2 arrivals (CMN T2)",
};

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatEurCents(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}

function shortRef(uuid: string): string {
  return uuid.replace(/-/g, "").slice(0, 8).toUpperCase();
}

// ─── Sub-step action panel (right column upper) ───────────────────────────────

function NextAction({
  reservation,
  paymentRecovery,
}: {
  reservation: ReservationViewModel;
  paymentRecovery: ReservationPaymentIntentRecoveryViewModel | null;
}) {
  const { status } = reservation;

  if (status === "PENDING_DEPOSIT") {
    return (
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Step 2A — Authorize checkout hold
        </h2>
        <PaymentPanelLoader
          clientSecret={paymentRecovery?.clientSecret ?? null}
          depositEurCents={reservation.depositEurCents}
          reservationId={reservation.id}
          totalPriceEurCents={reservation.totalPriceEurCents}
        />
      </div>
    );
  }

  if (status === "AWAITING_CAPTURE") {
    return (
      <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Clock aria-hidden="true" className="h-4 w-4 text-blue-500" />
          <h2 className="text-sm font-semibold text-blue-950">Processing authorization</h2>
        </div>
        <p className="text-xs leading-relaxed text-blue-800 font-light">
          Your authorization is being confirmed. This page will reflect the updated status shortly.
        </p>
        <Link
          className="inline-flex h-9 items-center justify-center rounded-full border border-blue-200 bg-white px-5 text-xs font-semibold text-neutral-900 transition hover:bg-neutral-50 shadow-sm"
          href="/dashboard"
        >
          Return to dashboard
        </Link>
      </div>
    );
  }

  if (status === "CONFIRMED") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-emerald-500" />
          <h2 className="text-sm font-semibold text-emerald-950">
            Step 2B — Upload documents
          </h2>
        </div>
        <p className="text-xs leading-relaxed text-emerald-800 font-light">
          Provide your driver&apos;s license and passport so our terminal operators can
          pre-approve key delivery before your flight lands.
        </p>
        <Link
          className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-neutral-950 px-5 text-xs font-semibold text-white transition hover:bg-neutral-800 shadow-sm"
          href={`/reservations/${reservation.id}/check-in`}
        >
          Continue to document check-in
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  if (status === "CANCELLED") {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-neutral-950">Reservation cancelled</h2>
        <p className="text-xs leading-relaxed text-neutral-600 font-light">
          This booking was cancelled and any card holds have been released.
        </p>
        <Link
          className="inline-flex h-10 w-full items-center justify-center rounded-full bg-neutral-950 px-5 text-xs font-semibold text-white transition hover:bg-neutral-800 shadow-sm"
          href="/catalog"
        >
          Explore fleet
        </Link>
      </div>
    );
  }

  return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-neutral-900">Rental dashboard</h2>
        <p className="text-xs leading-relaxed text-neutral-600 font-light">
          Access real-time reservation status in your customer dashboard.
        </p>
      <Link
        className="inline-flex h-10 w-full items-center justify-center rounded-full border border-neutral-200 bg-white px-5 text-xs font-semibold text-neutral-900 transition hover:bg-neutral-50 shadow-sm"
        href="/dashboard"
      >
        Go to dashboard
      </Link>
    </div>
  );
}

// ─── "To prepare pickup" guide ────────────────────────────────────────────────

function NextStepsGuide({ status, reservationId }: { status: ReservationViewModel["status"]; reservationId: string }) {
  if (!["PENDING_DEPOSIT", "AWAITING_CAPTURE", "CONFIRMED"].includes(status)) return null;

  const steps = [
    {
      n: "2A",
      label: "Authorize the refundable checkout hold",
      done: ["AWAITING_CAPTURE", "CONFIRMED"].includes(status),
      href: null,
    },
    {
      n: "2B",
      label: "Upload driver's license and passport",
      done: false,
      href: status === "CONFIRMED" ? `/reservations/${reservationId}/check-in` : null,
    },
    {
      n: "3",
      label: "Wait for operator approval, then pickup",
      done: false,
      href: null,
    },
  ];

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
        To prepare pickup
      </h3>
      <ol className="space-y-3">
        {steps.map((step) => (
          <li key={step.n} className="flex items-start gap-3 text-xs">
            <span
              className={[
                "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold",
                step.done
                  ? "bg-[#1E41FC] text-white"
                  : "border border-neutral-200 text-neutral-400 bg-neutral-50",
              ].join(" ")}
            >
              {step.done ? <Check aria-hidden="true" className="h-2.5 w-2.5" /> : step.n}
            </span>
            <span className={step.done ? "text-neutral-400 line-through font-light" : "text-neutral-700 font-medium"}>
              {step.href ? (
                <Link href={step.href} className="hover:underline">
                  {step.label}
                </Link>
              ) : (
                step.label
              )}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ConfirmationView({
  reservation,
  paymentRecovery,
}: ConfirmationViewProps) {
  const config = getStatusConfig(reservation.status);

  // Nav buttons: confirmed → can go to check-in; never go back to booking form
  const nextNav =
    reservation.status === "CONFIRMED"
      ? { label: "Continue to document check-in", href: `/reservations/${reservation.id}/check-in` }
      : reservation.status === "AWAITING_CAPTURE"
        ? { label: "Go to dashboard", href: "/dashboard" }
        : undefined;

  const prevNav = {
    label: "Back to booking form",
    href: `/book/${reservation.vehicle?.id}`,
    isCancelAction: true,
  };

  return (
    <JourneyShell
      currentStep={config.step}
      reservationId={reservation.id}
      vehicleId={reservation.vehicle?.id}
      heading={config.heading}
      subtitle={config.subtitle}
      prev={prevNav}
      next={nextNav}
    >
      {/* Status badge + short ref */}
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <span
          className={`inline-flex items-center rounded-full border px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${config.badgeClass}`}
        >
          {config.badgeText}
        </span>
        <span className="flex items-center gap-2 text-xs text-neutral-500">
          Booking ref:{" "}
          <span
            aria-label={`Booking reference ${shortRef(reservation.id)}`}
            className="font-mono font-semibold text-neutral-900 bg-neutral-50 border border-neutral-200/60 rounded px-2 py-0.5 tracking-wider"
          >
            {shortRef(reservation.id)}
          </span>
          <details className="text-[10px] text-neutral-400">
            <summary className="cursor-pointer hover:text-neutral-600 select-none">Full ID</summary>
            <span className="font-mono">{reservation.id}</span>
          </details>
        </span>
      </div>

      {/* ── Content grid ── */}
      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        {/* Left: Reservation summary */}
        <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="border-b border-neutral-100 px-6 py-4 bg-neutral-50/50">
            <h2 className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
              Reservation details
            </h2>
          </div>

          <dl className="divide-y divide-neutral-100 text-xs">
            {/* Vehicle */}
            {reservation.vehicle && (
              <div className="flex items-start gap-4 px-6 py-5">
                <span className="w-8 h-8 rounded-lg bg-neutral-50 border border-neutral-200/60 flex items-center justify-center text-[#1E41FC] shrink-0">
                  <Car aria-hidden="true" className="h-4 w-4" />
                </span>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Vehicle</dt>
                  <dd className="mt-0.5 text-sm font-semibold text-neutral-900">{reservation.vehicle.name}</dd>
                  {reservation.vehicle.category && (
                    <dd className="text-xs text-neutral-500 font-light uppercase tracking-wider mt-0.5">
                      {reservation.vehicle.category} Class
                    </dd>
                  )}
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="flex items-start gap-4 px-6 py-5">
              <span className="w-8 h-8 rounded-lg bg-neutral-50 border border-neutral-200/60 flex items-center justify-center text-[#1E41FC] shrink-0">
                <CalendarDays aria-hidden="true" className="h-4 w-4" />
              </span>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Rental dates</dt>
                <dd className="mt-0.5 text-sm font-semibold text-neutral-900 flex flex-wrap items-center gap-2">
                  {formatDate(reservation.pickupDate)}
                  <span className="text-neutral-300 font-normal" aria-hidden="true">&rarr;</span>
                  {formatDate(reservation.returnDate)}
                </dd>
                <dd className="mt-0.5 text-xs text-neutral-500 font-light">
                  Duration: {reservation.totalDays}{" "}
                  {reservation.totalDays === 1 ? "day" : "days"}
                </dd>
              </div>
            </div>

            {/* Terminal */}
            <div className="flex items-start gap-4 px-6 py-5">
              <span className="w-8 h-8 rounded-lg bg-neutral-50 border border-neutral-200/60 flex items-center justify-center text-[#1E41FC] shrink-0">
                <MapPin aria-hidden="true" className="h-4 w-4" />
              </span>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Pickup terminal</dt>
                <dd className="mt-0.5 text-sm font-semibold text-neutral-900">
                  Casablanca Mohammed V Airport (CMN)
                </dd>
                {reservation.pickupLocation && TERMINAL_LABELS[reservation.pickupLocation] && (
                  <dd className="text-xs text-neutral-500 font-light mt-0.5">
                    {TERMINAL_LABELS[reservation.pickupLocation]}
                  </dd>
                )}
              </div>
            </div>

            {/* Payment breakdown */}
            <div className="flex items-start gap-4 px-6 py-5">
              <span className="w-8 h-8 rounded-lg bg-neutral-50 border border-neutral-200/60 flex items-center justify-center text-[#1E41FC] shrink-0">
                <CreditCard aria-hidden="true" className="h-4 w-4" />
              </span>
              <div className="flex-1 space-y-3">
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                  Authorized payment summary
                </dt>
                <dd className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-neutral-500">Rental duration total</span>
                    <span className="font-semibold text-neutral-900">
                      {formatEurCents(reservation.totalPriceEurCents)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-neutral-500">Refundable security deposit</span>
                    <span className="font-semibold text-neutral-900">
                      {formatEurCents(reservation.depositEurCents)}
                    </span>
                  </div>
                  <div className="pt-2.5 border-t border-neutral-100 flex justify-between text-xs">
                    <span className="font-bold text-neutral-900">Total authorized checkout hold</span>
                    <span className="font-bold text-[#1E41FC]">
                      {formatEurCents(reservation.totalPriceEurCents + reservation.depositEurCents)}
                    </span>
                  </div>
                </dd>
                <dd className="text-[10px] text-neutral-400 font-light leading-relaxed">
                  The checkout hold is authorized via Stripe. No funds are captured until your documents are
                  verified and handoff conditions are met. The security deposit is released on return.
                </dd>
              </div>
            </div>
          </dl>
        </div>

        {/* Right: action + prep guide */}
        <div className="space-y-6">
          <NextAction
            reservation={reservation}
            paymentRecovery={paymentRecovery}
          />
          <NextStepsGuide status={reservation.status} reservationId={reservation.id} />
        </div>
      </div>
    </JourneyShell>
  );
}
