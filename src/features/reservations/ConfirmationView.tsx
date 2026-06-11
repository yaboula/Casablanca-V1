/**
 * ConfirmationView — step 2 of the Reserve → Verify → Pickup journey.
 *
 * This is the entry point to Verify:
 *   1 Reserve ✅  2 Verify ⏳  3 Pickup 🔒
 *
 * Inside Verify:
 *   2A Payment authorization
 *   2B Document check-in
 *
 * Rules:
 * - No fake payment success.
 * - No hardcoded reservation refs.
 * - Demo bypass always honest.
 * - Booking reference shown short to the customer; full UUID secondary.
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
  Lock,
} from "lucide-react";
import type { ReservationViewModel } from "./types";
import { PaymentPanelLoader } from "@/features/payments/PaymentPanelLoader";

type ConfirmationViewProps = {
  reservation: ReservationViewModel;
};

// ─── Journey progress ────────────────────────────────────────────────────────

type JourneyStatus = "done" | "current" | "locked";

type JourneyStep = {
  n: number;
  label: string;
  status: JourneyStatus;
  sublabel?: string;
};

function getJourneySteps(reservationStatus: ReservationViewModel["status"]): JourneyStep[] {
  const verifyDone = ["CONFIRMED", "IN_PROGRESS", "COMPLETED"].includes(reservationStatus);
  const verifyCurrent =
    reservationStatus === "PENDING_DEPOSIT" || reservationStatus === "AWAITING_CAPTURE";
  const pickupDone = reservationStatus === "IN_PROGRESS" || reservationStatus === "COMPLETED";
  const pickupCurrent = reservationStatus === "CONFIRMED";

  return [
    {
      n: 1,
      label: "Reserve",
      sublabel: "Reservation created",
      status: "done",
    },
    {
      n: 2,
      label: "Verify",
      sublabel: verifyDone
        ? "Payment & documents verified"
        : verifyCurrent
          ? "Payment authorization · Document check-in"
          : "Payment & documents",
      status: verifyDone ? "done" : verifyCurrent ? "current" : "locked",
    },
    {
      n: 3,
      label: "Pickup",
      sublabel: pickupDone
        ? "Vehicle handed over"
        : pickupCurrent
          ? "Ready for pickup"
          : "Unlocked after operator approval",
      status: pickupDone ? "done" : pickupCurrent ? "current" : "locked",
    },
  ];
}

// ─── Status config (page-level framing) ─────────────────────────────────────

type StatusConfig = {
  eyebrow: string;
  heading: string;
  description: string;
  badgeClass: string;
  badgeText: string;
};

function getStatusConfig(status: ReservationViewModel["status"]): StatusConfig {
  switch (status) {
    case "PENDING_DEPOSIT":
      return {
        eyebrow: "Step 2 of 3 — Verify",
        heading: "Verify your reservation.",
        description:
          "Your vehicle is held. Authorize the checkout hold, then upload your documents before arrival.",
        badgeClass: "border-amber-200 bg-amber-50/50 text-amber-800",
        badgeText: "Awaiting verification",
      };
    case "AWAITING_CAPTURE":
      return {
        eyebrow: "Step 2 of 3 — Verify",
        heading: "Verify your reservation.",
        description:
          "Authorization received. We are confirming your payment status — this usually takes a few seconds.",
        badgeClass: "border-blue-200 bg-blue-50/50 text-blue-800",
        badgeText: "Processing authorization",
      };
    case "CONFIRMED":
      return {
        eyebrow: "Step 2 of 3 — Verify",
        heading: "Payment verified.",
        description:
          "Checkout hold authorized. Upload your documents to complete check-in and prepare pickup.",
        badgeClass: "border-emerald-200 bg-emerald-50/40 text-emerald-800",
        badgeText: "Payment verified",
      };
    case "IN_PROGRESS":
      return {
        eyebrow: "Step 3 of 3 — Pickup",
        heading: "Rental in progress.",
        description: "The keys have been handed over. Drive safely and enjoy your trip.",
        badgeClass: "border-neutral-200 bg-neutral-50 text-neutral-800",
        badgeText: "In progress",
      };
    case "COMPLETED":
      return {
        eyebrow: "Completed",
        heading: "Rental completed.",
        description: "Thank you for renting with Nexus Mobility.",
        badgeClass: "border-neutral-200 bg-neutral-50 text-neutral-500",
        badgeText: "Completed",
      };
    case "CANCELLED":
      return {
        eyebrow: "Reservation cancelled",
        heading: "Reservation cancelled.",
        description:
          "This reservation has been cancelled. If you have questions, contact our operations desk.",
        badgeClass: "border-red-200 bg-red-50/50 text-red-800",
        badgeText: "Cancelled",
      };
    default:
      return {
        eyebrow: "Reservation status",
        heading: "Reservation status update.",
        description: "Please check your rental details below.",
        badgeClass: "border-neutral-200 bg-neutral-50 text-neutral-700",
        badgeText: status,
      };
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

/** Short customer-facing reference: first 8 chars of UUID uppercased. */
function shortRef(uuid: string): string {
  return uuid.replace(/-/g, "").slice(0, 8).toUpperCase();
}

// ─── Journey Stepper ─────────────────────────────────────────────────────────

function JourneyStepper({ steps }: { steps: JourneyStep[] }) {
  return (
    <nav aria-label="Booking journey progress">
      <ol className="space-y-3">
        {steps.map((step) => {
          const isDone = step.status === "done";
          const isCurrent = step.status === "current";
          const isLocked = step.status === "locked";

          return (
            <li key={step.n} className="flex items-start gap-3">
              <span
                aria-current={isCurrent ? "step" : undefined}
                className={[
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold transition-all duration-300",
                  isDone
                    ? "bg-[#1E41FC] text-white"
                    : isCurrent
                      ? "bg-neutral-950 text-white"
                      : "border border-neutral-200 bg-neutral-50 text-neutral-400",
                ].join(" ")}
              >
                {isDone ? (
                  <Check aria-hidden="true" className="h-3 w-3" />
                ) : isLocked ? (
                  <Lock aria-hidden="true" className="h-2.5 w-2.5" />
                ) : (
                  step.n
                )}
              </span>

              <div>
                <span
                  className={[
                    "text-xs font-semibold leading-5",
                    isDone
                      ? "text-neutral-400"
                      : isCurrent
                        ? "text-neutral-950"
                        : "text-neutral-400",
                  ].join(" ")}
                >
                  {step.label}
                  {isDone && (
                    <span className="sr-only"> — completed</span>
                  )}
                  {isCurrent && (
                    <span className="sr-only"> — current step</span>
                  )}
                  {isLocked && (
                    <span className="sr-only"> — locked</span>
                  )}
                </span>
                {step.sublabel && (
                  <p
                    className={[
                      "text-[10px] font-light leading-4",
                      isDone ? "text-neutral-300" : isCurrent ? "text-neutral-600" : "text-neutral-300",
                    ].join(" ")}
                  >
                    {step.sublabel}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ─── Next action panel (right column upper) ───────────────────────────────────

function NextAction({ reservation }: { reservation: ReservationViewModel }) {
  const { status, stripeClientSecret } = reservation;

  if (status === "PENDING_DEPOSIT") {
    return (
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Step 2A — Authorize checkout hold
        </h2>
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
            Processing authorization
          </h2>
        </div>
        <p className="text-xs leading-relaxed text-blue-800 font-light">
          Your authorization is being confirmed. This page will reflect the updated status shortly — you can refresh manually or return to your dashboard.
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
            Step 2B — Upload documents
          </h2>
        </div>
        <p className="text-xs leading-relaxed text-emerald-800 font-light">
          Provide your driver&apos;s license and passport so our terminal operators can pre-approve key delivery before your flight lands.
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
        <h2 className="text-sm font-semibold text-neutral-950 font-display">Reservation cancelled</h2>
        <p className="text-xs leading-relaxed text-neutral-600 font-light">
          This booking was cancelled and any card holds have been released. Browse our fleet to open a new reservation.
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

// ─── What happens next ────────────────────────────────────────────────────────

function NextStepsGuide({ status }: { status: ReservationViewModel["status"] }) {
  if (!["PENDING_DEPOSIT", "AWAITING_CAPTURE", "CONFIRMED"].includes(status)) return null;

  const steps = [
    {
      n: "2A",
      label: "Authorize the refundable checkout hold",
      done: ["AWAITING_CAPTURE", "CONFIRMED"].includes(status),
    },
    {
      n: "2B",
      label: "Upload driver's license and passport",
      done: false,
    },
    {
      n: "3",
      label: "Wait for operator approval — then pickup",
      done: false,
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
            <span
              className={step.done ? "text-neutral-400 line-through font-light" : "text-neutral-700 font-medium"}
            >
              {step.label}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ConfirmationView({ reservation }: ConfirmationViewProps) {
  const config = getStatusConfig(reservation.status);
  const steps = getJourneySteps(reservation.status);

  return (
    <article className="nx-container py-10 md:py-14 space-y-10">
      {/* ── Header ── */}
      <header className="space-y-4 max-w-2xl">
        {/* Eyebrow + badge */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
            {config.eyebrow}
          </span>
          <span
            className={`inline-flex items-center rounded-full border px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${config.badgeClass}`}
          >
            {config.badgeText}
          </span>
        </div>

        {/* H1 */}
        <h1 className="nx-h2 font-display font-light text-neutral-900 leading-tight">
          {config.heading}
        </h1>

        {/* Subtitle */}
        <p className="nx-lead text-neutral-600 font-light leading-relaxed">
          {config.description}
        </p>

        {/* Booking reference — short + accessible full UUID */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-neutral-500 font-medium">Booking reference</span>
          <span
            aria-label={`Booking reference ${shortRef(reservation.id)}`}
            className="font-mono text-sm font-semibold text-neutral-900 bg-neutral-50 border border-neutral-200/60 rounded px-2 py-0.5 shadow-sm tracking-wider"
          >
            {shortRef(reservation.id)}
          </span>
          <details className="text-[10px] text-neutral-400">
            <summary className="cursor-pointer hover:text-neutral-600 select-none">
              Full ID
            </summary>
            <span className="font-mono">{reservation.id}</span>
          </details>
        </div>
      </header>

      {/* ── Grid Content ── */}
      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        {/* ── Left: Reservation summary ── */}
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

            {/* Dates */}
            <div className="flex items-start gap-4 px-6 py-5">
              <span className="w-8 h-8 rounded-lg bg-neutral-50 border border-neutral-200/60 flex items-center justify-center text-[#1E41FC] shrink-0">
                <CalendarDays aria-hidden="true" className="h-4 w-4" />
              </span>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                  Rental dates
                </dt>
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
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                  Pickup terminal
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
                    <span className="font-bold text-neutral-900">
                      Total authorized checkout hold
                    </span>
                    <span className="font-bold text-[#1E41FC]">
                      {formatEurCents(
                        reservation.totalPriceEurCents + reservation.depositEurCents,
                      )}
                    </span>
                  </div>
                </dd>
                <dd className="text-[10px] text-neutral-400 font-light leading-relaxed">
                  The full checkout hold is authorized on your card via Stripe. No funds are captured until your documents are verified and handoff conditions are met. The security deposit is released on return.
                </dd>
              </div>
            </div>
          </dl>
        </div>

        {/* ── Right: action + journey ── */}
        <div className="space-y-6">
          {/* Primary action */}
          <NextAction reservation={reservation} />

          {/* Next steps guide */}
          <NextStepsGuide status={reservation.status} />

          {/* Journey stepper */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Your journey
            </h3>
            <JourneyStepper steps={steps} />
          </div>
        </div>
      </div>
    </article>
  );
}
