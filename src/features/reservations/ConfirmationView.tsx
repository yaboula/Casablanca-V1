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
  Check,
  ArrowRight,
} from "lucide-react";
import type { ReservationViewModel } from "./types";
import { PaymentPanelLoader } from "@/features/payments/PaymentPanelLoader";

type ConfirmationViewProps = {
  reservation: ReservationViewModel;
};

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
        iconClass: "text-amber-500",
        heading: "Deposit authorization required",
        description:
          "Your reservation is held. Authorize the security deposit capture via Stripe to lock the vehicle.",
        badgeClass: "border-amber-200 bg-amber-50/50 text-amber-800",
        badgeText: "Awaiting deposit",
      };
    case "AWAITING_CAPTURE":
      return {
        icon: Clock,
        iconClass: "text-blue-500",
        heading: "Payment is being processed",
        description:
          "Stripe deposit authorized. We are updating your payment status.",
        badgeClass: "border-blue-200 bg-blue-50/50 text-blue-800",
        badgeText: "Processing",
      };
    case "CONFIRMED":
      return {
        icon: CheckCircle2,
        iconClass: "text-emerald-500",
        heading: "Reservation confirmed",
        description:
          "Stripe deposit authorized successfully. Proceed with document upload to complete check-in.",
        badgeClass: "border-emerald-250 bg-emerald-50/40 text-emerald-800",
        badgeText: "Confirmed",
      };
    case "IN_PROGRESS":
      return {
        icon: CheckCircle2,
        iconClass: "text-neutral-900",
        heading: "Rental is active",
        description: "The keys have been handed over. Drive safely.",
        badgeClass: "border-neutral-200 bg-neutral-50 text-neutral-800",
        badgeText: "In progress",
      };
    case "COMPLETED":
      return {
        icon: CheckCircle2,
        iconClass: "text-neutral-400",
        heading: "Rental completed",
        description: "Thank you for renting with Nexus Mobility.",
        badgeClass: "border-neutral-200 bg-neutral-50 text-neutral-500",
        badgeText: "Completed",
      };
    case "CANCELLED":
      return {
        icon: AlertTriangle,
        iconClass: "text-red-500",
        heading: "Reservation cancelled",
        description:
          "This reservation has been cancelled. If you have questions, contact our operations desk.",
        badgeClass: "border-red-200 bg-red-50/50 text-red-800",
        badgeText: "Cancelled",
      };
    default:
      return {
        icon: Clock,
        iconClass: "text-neutral-400",
        heading: "Reservation status update",
        description: "Please check your rental parameters below.",
        badgeClass: "border-neutral-250 bg-neutral-50 text-neutral-700",
        badgeText: status,
      };
  }
}

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

function NextAction({ reservation }: { reservation: ReservationViewModel }) {
  const { status, stripeClientSecret } = reservation;

  if (status === "PENDING_DEPOSIT") {
    return (
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Stripe Secure Checkout
        </h3>
        <PaymentPanelLoader
          clientSecret={stripeClientSecret}
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
          <h2 className="text-sm font-semibold text-blue-950 font-display">
            Awaiting Confirmation
          </h2>
        </div>
        <p className="text-xs leading-relaxed text-blue-800 font-light">
          Your deposit check is resolving. This page updates automatically once authorization is finalized by Stripe.
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
          <h2 className="text-sm font-semibold text-emerald-950 font-display">
            Upload Documents
          </h2>
        </div>
        <p className="text-xs leading-relaxed text-emerald-800 font-light">
          Provide your driver&apos;s license and ID now so our terminal operators can pre-approve key delivery before your flight lands.
        </p>
        <Link
          className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-neutral-950 px-5 text-xs font-semibold text-white transition hover:bg-neutral-800 shadow-sm"
          href={`/reservations/${reservation.id}/check-in`}
        >
          Upload check-in documents
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  if (status === "CANCELLED") {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-neutral-950 font-display">Reservation Cancelled</h2>
        <p className="text-xs leading-relaxed text-neutral-600 font-light">
          This booking was cancelled and card holds released. Browse our fleet catalog to open another reservation.
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
      <h2 className="text-sm font-semibold text-neutral-900 font-display">Rental dashboard</h2>
      <p className="text-xs leading-relaxed text-neutral-600 font-light">
        Access real-time statuses and QR keys directly inside your customer dashboard.
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

export function ConfirmationView({ reservation }: ConfirmationViewProps) {
  const config = getStatusConfig(reservation.status);
  const StatusIcon = config.icon;

  return (
    <article className="nx-container py-10 md:py-14 space-y-10">
      {/* Header section */}
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <StatusIcon
            aria-hidden="true"
            className={`h-7 w-7 shrink-0 ${config.iconClass}`}
          />
          <span
            className={`inline-flex items-center rounded-full border px-3.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${config.badgeClass}`}
          >
            {config.badgeText}
          </span>
        </div>

        <h1 className="nx-h2 font-display font-light text-neutral-900 leading-tight">
          {config.heading}
        </h1>
        <p className="nx-lead text-neutral-600 font-light max-w-2xl leading-relaxed">
          {config.description}
        </p>

        <p className="text-xs text-neutral-400 font-medium">
          Reservation reference:{" "}
          <span className="font-mono text-xs text-neutral-900 bg-neutral-50 border border-neutral-200/60 rounded px-2 py-0.5 shadow-sm">
            {reservation.id}
          </span>
        </p>
      </header>

      {/* Grid Content */}
      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        {/* Left Side: Summary Panel */}
        <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="border-b border-neutral-100 px-6 py-4.5 bg-neutral-50/50">
            <h2 className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
              Reservation details
            </h2>
          </div>

          <dl className="divide-y divide-neutral-100 text-xs">
            {/* Vehicle Detail */}
            {reservation.vehicle && (
              <div className="flex items-start gap-4 px-6 py-4.5">
                <span className="w-8 h-8 rounded-lg bg-neutral-50 border border-neutral-200/60 flex items-center justify-center text-[#1E41FC]">
                  <Car aria-hidden="true" className="h-4 w-4 shrink-0" />
                </span>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                    Vehicle
                  </dt>
                  <dd className="mt-0.5 text-sm font-semibold text-neutral-900">
                    {reservation.vehicle.name}
                  </dd>
                  {reservation.vehicle.category && (
                    <dd className="text-xs text-neutral-500 font-light uppercase tracking-wider mt-0.5">
                      {reservation.vehicle.category} Class
                    </dd>
                  )}
                </div>
              </div>
            )}

            {/* Trip dates */}
            <div className="flex items-start gap-4 px-6 py-4.5">
              <span className="w-8 h-8 rounded-lg bg-neutral-50 border border-neutral-200/60 flex items-center justify-center text-[#1E41FC]">
                <CalendarDays aria-hidden="true" className="h-4 w-4 shrink-0" />
              </span>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                  Rental Dates
                </dt>
                <dd className="mt-0.5 text-sm font-semibold text-neutral-900 flex items-center gap-2">
                  {formatDate(reservation.pickupDate)}
                  <span className="text-neutral-300 font-normal">&rarr;</span>
                  {formatDate(reservation.returnDate)}
                </dd>
                <dd className="mt-0.5 text-xs text-neutral-500 font-light">
                  Duration: {reservation.totalDays}{" "}
                  {reservation.totalDays === 1 ? "day" : "days"}
                </dd>
              </div>
            </div>

            {/* Pickup location */}
            <div className="flex items-start gap-4 px-6 py-4.5">
              <span className="w-8 h-8 rounded-lg bg-neutral-50 border border-neutral-200/60 flex items-center justify-center text-[#1E41FC]">
                <MapPin aria-hidden="true" className="h-4 w-4 shrink-0" />
              </span>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                  Pickup Terminal
                </dt>
                <dd className="mt-0.5 text-sm font-semibold text-neutral-900">
                  Casablanca Mohammed V Airport (CMN)
                </dd>
                {reservation.pickupLocation &&
                  TERMINAL_LABELS[reservation.pickupLocation] && (
                    <dd className="text-xs text-neutral-500 font-light mt-0.5">
                      {TERMINAL_LABELS[reservation.pickupLocation]}
                    </dd>
                  )}
              </div>
            </div>

            {/* Payment Summary */}
            <div className="flex items-start gap-4 px-6 py-4.5">
              <span className="w-8 h-8 rounded-lg bg-neutral-50 border border-neutral-200/60 flex items-center justify-center text-[#1E41FC]">
                <CreditCard aria-hidden="true" className="h-4 w-4 shrink-0" />
              </span>
              <div className="flex-1 space-y-3">
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                  Authorized Payment summary
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
                    <span className="font-bold text-neutral-900">
                      Total authorized checkout hold
                    </span>
                    <span className="font-bold text-[#1E41FC]">
                      {formatEurCents(
                        reservation.totalPriceEurCents +
                          reservation.depositEurCents,
                      )}
                    </span>
                  </div>
                </dd>
                <dd className="text-[10px] text-neutral-400 font-light leading-relaxed">
                  Hold totals are authorized on your card via secure Stripe checkout. No funds are captures until final delivery checks, and security deposits are released instantly on return.
                </dd>
              </div>
            </div>
          </dl>
        </div>

        {/* Right Side: Next Action & Steps */}
        <div className="space-y-6">
          <NextAction reservation={reservation} />

          {/* Steps Timeline Card */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Rental Progress
            </h3>
            <ol className="space-y-4">
              {[
                {
                  n: 1,
                  label: "Reservation Created",
                  done: true,
                  current: false,
                },
                {
                  n: 2,
                  label: "Deposit checkout & Document check-in",
                  done: ["CONFIRMED", "IN_PROGRESS", "COMPLETED"].includes(
                    reservation.status,
                  ),
                  current:
                    reservation.status === "PENDING_DEPOSIT" ||
                    reservation.status === "AWAITING_CAPTURE",
                },
                {
                  n: 3,
                  label: "Arrival pickup & Handoff",
                  done:
                    reservation.status === "IN_PROGRESS" ||
                    reservation.status === "COMPLETED",
                  current: reservation.status === "CONFIRMED",
                },
              ].map((step) => (
                <li key={step.n} className="flex items-center gap-3 text-xs font-medium">
                  <span
                    className={[
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold shadow-sm transition-all duration-300",
                      step.done
                        ? "bg-[#1E41FC] text-white"
                        : step.current
                          ? "bg-neutral-950 text-white"
                          : "border border-neutral-200 text-neutral-400 bg-neutral-50",
                    ].join(" ")}
                  >
                    {step.done ? (
                      <Check
                        aria-hidden="true"
                        className="h-3 w-3"
                      />
                    ) : (
                      step.n
                    )}
                  </span>
                  <span
                    className={
                      step.current
                        ? "font-semibold text-neutral-950"
                        : step.done
                          ? "text-neutral-400 line-through font-light"
                          : "text-neutral-400 font-light"
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
