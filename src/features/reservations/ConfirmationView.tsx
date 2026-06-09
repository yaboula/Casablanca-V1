/**
 * ConfirmationView — server-renderable confirmation page component.
 *
 * Displays backend-confirmed reservation data only. No fake payment success.
 * No hardcoded reservation refs. No fake QR or smart ticket.
 *
 * Payment state is derived from backend status:
 * - PENDING_DEPOSIT + stripeClientSecret present: render StripeDepositPanel
 * - PENDING_DEPOSIT + stripeClientSecret missing: show config/backend error
 * - AWAITING_CAPTURE: show "payment processing" state
 * - CONFIRMED+: show confirmed state, next step toward check-in
 * - CANCELLED: show cancellation state
 *
 * Stripe loads only when the StripeDepositPanel renders (status=PENDING_DEPOSIT).
 * StripeDepositPanel is a dynamic import ("use client") that never affects
 * server-side rendering of other reservation states.
 */

import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  CalendarDays,
  MapPin,
  Car,
  CreditCard,
} from "lucide-react";
import type { ReservationViewModel } from "./types";
import { PaymentPanelLoader } from "@/features/payments/PaymentPanelLoader";

// No ssr:false dynamic import here — ConfirmationView is a Server Component.
// The payment panel dynamic import lives in PaymentPanelLoader (a client component).

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type ConfirmationViewProps = {
  reservation: ReservationViewModel;
};

// ---------------------------------------------------------------------------
// Status display config
// ---------------------------------------------------------------------------

type StatusConfig = {
  icon: typeof CheckCircle2;
  iconClass: string;
  heading: string;
  description: string;
  badgeClass: string;
  badgeText: string;
};

function getStatusConfig(status: ReservationViewModel["status"]): StatusConfig {
  switch (status) {
    case "PENDING_DEPOSIT":
      return {
        icon: CreditCard,
        iconClass: "text-amber-600",
        heading: "Reservation created — deposit required.",
        description:
          "Your booking is held in the system. Authorize the refundable security deposit to confirm your vehicle.",
        badgeClass: "border-amber-200 bg-amber-50 text-amber-800",
        badgeText: "Awaiting deposit",
      };
    case "AWAITING_CAPTURE":
      return {
        icon: Clock,
        iconClass: "text-blue-600",
        heading: "Payment is being processed.",
        description:
          "Your documents have been approved. The deposit capture is in progress — this may take a moment.",
        badgeClass: "border-blue-200 bg-blue-50 text-blue-800",
        badgeText: "Processing payment",
      };
    case "CONFIRMED":
      return {
        icon: CheckCircle2,
        iconClass: "text-green-600",
        heading: "Reservation confirmed.",
        description:
          "Deposit captured and reservation confirmed. Upload your documents to complete the check-in process.",
        badgeClass: "border-green-200 bg-green-50 text-green-800",
        badgeText: "Confirmed",
      };
    case "IN_PROGRESS":
      return {
        icon: CheckCircle2,
        iconClass: "text-neutral-700",
        heading: "Vehicle in use.",
        description: "Your rental is active.",
        badgeClass: "border-neutral-200 bg-neutral-50 text-neutral-700",
        badgeText: "In progress",
      };
    case "COMPLETED":
      return {
        icon: CheckCircle2,
        iconClass: "text-neutral-500",
        heading: "Rental completed.",
        description: "Thank you for choosing Nexus Mobility.",
        badgeClass: "border-neutral-200 bg-neutral-50 text-neutral-500",
        badgeText: "Completed",
      };
    case "CANCELLED":
      return {
        icon: AlertTriangle,
        iconClass: "text-red-600",
        heading: "Reservation cancelled.",
        description:
          "This reservation has been cancelled. No charge was made. Return to the fleet to book again.",
        badgeClass: "border-red-200 bg-red-50 text-red-800",
        badgeText: "Cancelled",
      };
    default:
      return {
        icon: Clock,
        iconClass: "text-neutral-500",
        heading: "Reservation created.",
        description: "Check your dashboard for current status.",
        badgeClass: "border-neutral-200 bg-neutral-50 text-neutral-700",
        badgeText: status,
      };
  }
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

const TERMINAL_LABELS: Record<string, string> = {
  CMN_T1: "Terminal 1 (CMN T1)",
  CMN_T2: "Terminal 2 (CMN T2)",
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

// ---------------------------------------------------------------------------
// Next action section — right-hand panel
// ---------------------------------------------------------------------------

function NextAction({ reservation }: { reservation: ReservationViewModel }) {
  const { status, stripeClientSecret } = reservation;

  // ------------------------------------------------------------------
  // PENDING_DEPOSIT — the primary payment state
  // ------------------------------------------------------------------
  if (status === "PENDING_DEPOSIT") {
    // Delegate to PaymentPanelLoader — a client component that owns the
    // ssr:false dynamic import for StripeDepositPanel.
    // It handles both the present-secret and missing-secret cases.
    return (
      <PaymentPanelLoader
        clientSecret={stripeClientSecret}
        depositEurCents={reservation.depositEurCents}
        reservationId={reservation.id}
        totalPriceEurCents={reservation.totalPriceEurCents}
      />
    );
  }

  // ------------------------------------------------------------------
  // AWAITING_CAPTURE — deposit authorized, backend webhook processing
  // ------------------------------------------------------------------
  if (status === "AWAITING_CAPTURE") {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-5">
        <div className="flex items-center gap-2">
          <Clock aria-hidden="true" className="h-4 w-4 text-blue-600" />
          <h2 className="text-sm font-black text-blue-950">
            Payment processing
          </h2>
        </div>
        <p className="mt-2 text-sm leading-6 text-blue-800">
          Your documents have been approved and the deposit capture is
          being processed. This is automatic and typically takes a few
          seconds to a few minutes.
        </p>
        <Link
          className="mt-4 inline-flex min-h-11 items-center rounded-md border border-[var(--nx-line)] bg-white px-5 text-sm font-bold text-neutral-950 transition hover:bg-neutral-50"
          href="/dashboard"
        >
          Return to dashboard
        </Link>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // CONFIRMED — ready for document upload / check-in
  // ------------------------------------------------------------------
  if (status === "CONFIRMED") {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-5">
        <div className="flex items-center gap-2">
          <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-green-600" />
          <h2 className="text-sm font-black text-green-950">
            Reservation confirmed
          </h2>
        </div>
        <p className="mt-2 text-sm leading-6 text-green-800">
          Upload your passport and driving licence so the operator can
          verify your documents before pickup at CMN.
        </p>
        {/* Check-in route is Commit J */}
        <Link
          className="mt-4 inline-flex min-h-11 items-center rounded-md bg-neutral-950 px-5 text-sm font-bold text-white transition hover:bg-neutral-800"
          href="/dashboard"
        >
          Go to dashboard
        </Link>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // CANCELLED
  // ------------------------------------------------------------------
  if (status === "CANCELLED") {
    return (
      <div className="rounded-lg border border-[var(--nx-line)] bg-[var(--nx-bg-soft)] p-5">
        <h2 className="text-sm font-black text-neutral-950">Next steps</h2>
        <p className="mt-2 text-sm text-neutral-600">
          Your reservation has been cancelled. If you believe this is an
          error, contact support.
        </p>
        <Link
          className="mt-4 inline-flex min-h-11 items-center rounded-md bg-neutral-950 px-5 text-sm font-bold text-white transition hover:bg-neutral-800"
          href="/catalog"
        >
          Browse the fleet
        </Link>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Default (IN_PROGRESS, COMPLETED, unknown)
  // ------------------------------------------------------------------
  return (
    <div className="rounded-lg border border-[var(--nx-line)] p-5">
      <h2 className="text-sm font-black text-neutral-950">Dashboard</h2>
      <p className="mt-2 text-sm text-neutral-600">
        View your reservations and track status from your dashboard.
      </p>
      <Link
        className="mt-4 inline-flex min-h-11 items-center rounded-md border border-[var(--nx-line)] px-5 text-sm font-bold transition hover:bg-neutral-50"
        href="/dashboard"
      >
        Go to dashboard
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ConfirmationView — main component
// ---------------------------------------------------------------------------

export function ConfirmationView({ reservation }: ConfirmationViewProps) {
  const config = getStatusConfig(reservation.status);
  const StatusIcon = config.icon;

  return (
    <article className="mx-auto w-full max-w-4xl px-6 py-10 md:py-14">
      {/* ------------------------------------------------------------------ */}
      {/* Status header                                                        */}
      {/* ------------------------------------------------------------------ */}
      <header className="mb-10">
        <div className="flex items-center gap-3">
          <StatusIcon
            aria-hidden="true"
            className={`h-8 w-8 shrink-0 ${config.iconClass}`}
          />
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${config.badgeClass}`}
          >
            {config.badgeText}
          </span>
        </div>

        <h1 className="mt-4 text-4xl font-black text-neutral-950">
          {config.heading}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-neutral-700">
          {config.description}
        </p>

        {/* Reservation reference — backend UUID only, never faked */}
        <p className="mt-4 text-sm text-neutral-500">
          Reservation reference:{" "}
          <span className="font-mono text-sm text-neutral-950">
            {reservation.id}
          </span>
        </p>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Two-column layout: details + next action                            */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
        {/* ---------------------------------------------------------------- */}
        {/* Reservation details card                                          */}
        {/* ---------------------------------------------------------------- */}
        <div className="rounded-lg border border-[var(--nx-line)] bg-white">
          <div className="border-b border-[var(--nx-line)] px-6 py-4">
            <h2 className="text-sm font-black uppercase tracking-[0.14em] text-neutral-500">
              Reservation details
            </h2>
          </div>

          <dl className="divide-y divide-[var(--nx-line)]">
            {/* Vehicle */}
            {reservation.vehicle && (
              <div className="flex items-start gap-3 px-6 py-4">
                <Car
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 shrink-0 text-[var(--nx-accent)]"
                />
                <div>
                  <dt className="text-xs font-bold text-neutral-500">
                    Vehicle
                  </dt>
                  <dd className="mt-0.5 text-sm font-bold text-neutral-950">
                    {reservation.vehicle.name}
                  </dd>
                  {reservation.vehicle.category && (
                    <dd className="text-xs text-neutral-500 capitalize">
                      {reservation.vehicle.category.toLowerCase()}
                    </dd>
                  )}
                </div>
              </div>
            )}

            {/* Trip dates */}
            <div className="flex items-start gap-3 px-6 py-4">
              <CalendarDays
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0 text-[var(--nx-accent)]"
              />
              <div>
                <dt className="text-xs font-bold text-neutral-500">
                  Trip dates
                </dt>
                <dd className="mt-0.5 text-sm font-bold text-neutral-950">
                  {formatDate(reservation.pickupDate)}
                  <span className="mx-2 font-normal text-neutral-400">
                    &rarr;
                  </span>
                  {formatDate(reservation.returnDate)}
                </dd>
                <dd className="mt-0.5 text-xs text-neutral-500">
                  {reservation.totalDays}{" "}
                  {reservation.totalDays === 1 ? "day" : "days"}
                </dd>
              </div>
            </div>

            {/* Pickup location */}
            <div className="flex items-start gap-3 px-6 py-4">
              <MapPin
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0 text-[var(--nx-accent)]"
              />
              <div>
                <dt className="text-xs font-bold text-neutral-500">
                  Pickup location
                </dt>
                <dd className="mt-0.5 text-sm font-bold text-neutral-950">
                  Casablanca Mohammed V Airport (CMN)
                </dd>
                {reservation.pickupLocation &&
                  TERMINAL_LABELS[reservation.pickupLocation] && (
                    <dd className="text-xs text-neutral-500">
                      {TERMINAL_LABELS[reservation.pickupLocation]}
                    </dd>
                  )}
              </div>
            </div>

            {/* Payment summary — backend totals only */}
            <div className="flex items-start gap-3 px-6 py-4">
              <CreditCard
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0 text-[var(--nx-accent)]"
              />
              <div className="flex-1">
                <dt className="text-xs font-bold text-neutral-500">
                  Payment summary
                </dt>
                <dd className="mt-2 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Total rental</span>
                    <span className="font-bold text-neutral-950">
                      {formatEurCents(reservation.totalPriceEurCents)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Security deposit</span>
                    <span className="font-bold text-neutral-950">
                      {formatEurCents(reservation.depositEurCents)}
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between border-t border-[var(--nx-line)] pt-2 text-sm">
                    <span className="font-black text-neutral-950">
                      Total authorized today
                    </span>
                    <span className="font-black text-neutral-950">
                      {formatEurCents(
                        reservation.totalPriceEurCents +
                          reservation.depositEurCents,
                      )}
                    </span>
                  </div>
                </dd>
                <dd className="mt-2 text-xs text-neutral-400">
                  All amounts calculated by the backend. Deposit is
                  authorized (not charged) and refundable on vehicle
                  return in good condition.
                </dd>
              </div>
            </div>
          </dl>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Next action panel + journey sidebar                               */}
        {/* ---------------------------------------------------------------- */}
        <div className="space-y-4">
          <NextAction reservation={reservation} />

          {/* Journey reminder */}
          <div className="rounded-lg border border-[var(--nx-line)] bg-white p-5">
            <h2 className="text-xs font-black uppercase tracking-[0.14em] text-neutral-500">
              Your journey
            </h2>
            <ol className="mt-3 space-y-3">
              {[
                {
                  n: 1,
                  label: "Reserve",
                  done: true,
                  current: false,
                },
                {
                  n: 2,
                  label: "Pay deposit & verify documents",
                  done: ["CONFIRMED", "IN_PROGRESS", "COMPLETED"].includes(
                    reservation.status,
                  ),
                  current:
                    reservation.status === "PENDING_DEPOSIT" ||
                    reservation.status === "AWAITING_CAPTURE",
                },
                {
                  n: 3,
                  label: "Pick up at CMN",
                  done:
                    reservation.status === "IN_PROGRESS" ||
                    reservation.status === "COMPLETED",
                  current: reservation.status === "CONFIRMED",
                },
              ].map((step) => (
                <li key={step.n} className="flex items-center gap-3 text-sm">
                  <span
                    className={[
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black",
                      step.done
                        ? "bg-[var(--nx-accent)] text-white"
                        : step.current
                          ? "bg-neutral-950 text-white"
                          : "border-2 border-[var(--nx-line)] text-neutral-400",
                    ].join(" ")}
                  >
                    {step.done ? (
                      <CheckCircle2
                        aria-hidden="true"
                        className="h-3.5 w-3.5"
                      />
                    ) : (
                      step.n
                    )}
                  </span>
                  <span
                    className={
                      step.current
                        ? "font-bold text-neutral-950"
                        : step.done
                          ? "text-neutral-600 line-through"
                          : "text-neutral-400"
                    }
                  >
                    {step.label}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </article>
  );
}
