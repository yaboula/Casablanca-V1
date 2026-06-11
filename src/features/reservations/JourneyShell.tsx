/**
 * JourneyShell — shared layout for Reserve → Verify → Pickup steps.
 *
 * Provides:
 * - Identical header template to BookingShell (Step X of 3, h1, subtitle)
 * - Navigable horizontal stepper
 * - Bottom nav bar with ← Back and Continue → buttons
 *
 * Used by:
 *   /book/[vehicleId]           → step 1 (BookingShell inlines this pattern)
 *   /reservations/[id]/confirmed → step 2 (Verify)
 *   /reservations/[id]/check-in  → step 2B (Verify — documents)
 *   /reservations/[id]/waiting   → step 2C (Verify — awaiting review)
 */

import Link from "next/link";
import { CheckCircle2, ArrowLeft, ArrowRight } from "lucide-react";

// ─── Step definitions ──────────────────────────────────────────────────────────

export type JourneyStepKey = "reserve" | "verify" | "verify-docs" | "pickup";

type StepDef = {
  key: JourneyStepKey;
  n: number;
  label: string;
  mainStep: 1 | 2 | 3;
};

const STEPS: StepDef[] = [
  { key: "reserve",     n: 1, label: "Reserve",  mainStep: 1 },
  { key: "verify",      n: 2, label: "Verify",   mainStep: 2 },
  { key: "verify-docs", n: 2, label: "Verify",   mainStep: 2 },
  { key: "pickup",      n: 3, label: "Pickup",   mainStep: 3 },
];

const VISIBLE_STEPS = [
  { n: 1, label: "Reserve", key: "reserve"     },
  { n: 2, label: "Verify",  key: "verify"      },
  { n: 3, label: "Pickup",  key: "pickup"      },
] as const;

// ─── URL helpers ───────────────────────────────────────────────────────────────

function stepUrl(key: JourneyStepKey, reservationId?: string): string | null {
  if (!reservationId) return null;
  switch (key) {
    case "reserve":     return null;
    case "verify":      return `/reservations/${reservationId}/confirmed`;
    case "verify-docs": return `/reservations/${reservationId}/check-in`;
    case "pickup":      return null;
    default:            return null;
  }
}

// ─── Stepper ──────────────────────────────────────────────────────────────────

function JourneyStepper({
  currentStep,
  reservationId,
}: {
  currentStep: JourneyStepKey;
  reservationId?: string;
}) {
  const currentDef = STEPS.find((s) => s.key === currentStep)!;
  const currentN = currentDef.n;

  return (
    <nav aria-label="Booking journey" className="mb-8">
      <ol className="flex items-center gap-0">
        {VISIBLE_STEPS.map((step, index) => {
          const isDone    = step.n < currentN;
          const isCurrent = step.n === currentN;
          const isLocked  = step.n > currentN;
          const href = isDone ? stepUrl(step.key as JourneyStepKey, reservationId) : null;

          const circleClass = [
            "flex h-7 w-7 items-center justify-center rounded-full text-xs font-black transition-colors",
            isDone    ? "bg-[var(--nx-accent)] text-white"                          : "",
            isCurrent ? "bg-neutral-950 text-white"                                 : "",
            isLocked  ? "border-2 border-[var(--nx-line)] bg-white text-neutral-400" : "",
          ].filter(Boolean).join(" ");

          const labelClass = [
            "text-sm font-bold transition-colors",
            isCurrent ? "text-neutral-950" : "text-neutral-400",
            isDone && href ? "group-hover:text-neutral-700" : "",
          ].filter(Boolean).join(" ");

          const circleEl = (
            <span aria-current={isCurrent ? "step" : undefined} className={circleClass}>
              {isDone ? (
                <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
              ) : (
                <span aria-hidden="true">{step.n}</span>
              )}
            </span>
          );

          const inner = isDone && href ? (
            <Link
              href={href}
              aria-label={`Go back to step ${step.n}: ${step.label}`}
              className="group flex items-center gap-2"
            >
              {circleEl}
              <span className={labelClass}>{step.label}</span>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              {circleEl}
              <span className={labelClass}>{step.label}</span>
            </div>
          );

          return (
            <li key={step.key} className="flex items-center">
              {inner}
              {index < VISIBLE_STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className={[
                    "mx-3 h-px w-8 sm:w-12 transition-colors",
                    isDone ? "bg-[var(--nx-accent)]" : "bg-[var(--nx-line)]",
                  ].join(" ")}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ─── Nav footer ───────────────────────────────────────────────────────────────

export type NavAction = {
  label: string;
  href: string;
};

function NavFooter({
  prev,
  next,
}: {
  prev?: NavAction;
  next?: NavAction;
}) {
  if (!prev && !next) return null;

  return (
    <div className="mt-10 flex items-center justify-between border-t border-neutral-100 pt-8">
      <div>
        {prev ? (
          <Link
            href={prev.href}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-neutral-200 bg-white px-5 text-xs font-semibold text-neutral-700 shadow-sm transition hover:border-neutral-400 hover:text-neutral-950"
          >
            <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
            {prev.label}
          </Link>
        ) : (
          <span />
        )}
      </div>

      <div>
        {next && (
          <Link
            href={next.href}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-neutral-950 px-5 text-xs font-semibold text-white shadow-sm transition hover:bg-neutral-800"
          >
            {next.label}
            <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────

export type JourneyShellProps = {
  currentStep: JourneyStepKey;
  reservationId?: string;
  heading: string;
  subtitle: string;
  /** Back button — appears bottom-left */
  prev?: NavAction;
  /** Forward button — appears bottom-right */
  next?: NavAction;
  children: React.ReactNode;
};

export function JourneyShell({
  currentStep,
  reservationId,
  heading,
  subtitle,
  prev,
  next,
  children,
}: JourneyShellProps) {
  const stepDef = STEPS.find((s) => s.key === currentStep)!;
  const eyebrow = `Step ${stepDef.mainStep} of 3`;

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-10 md:py-14">
      {/* Header */}
      <div className="mb-8 max-w-2xl">
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-neutral-500">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-normal text-neutral-950">
          {heading}
        </h1>
        <p className="mt-3 text-base leading-7 text-neutral-700">{subtitle}</p>
      </div>

      {/* Navigable stepper */}
      <JourneyStepper currentStep={currentStep} reservationId={reservationId} />

      {/* Page content */}
      {children}

      {/* Bottom navigation */}
      <NavFooter prev={prev} next={next} />
    </section>
  );
}
