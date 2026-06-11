/**
 * JourneyShell — shared layout for Reserve → Verify → Pickup steps.
 *
 * Provides the identical header template used in BookingShell (Step X of 3,
 * h1, subtitle) plus a navigable horizontal stepper. Used by:
 *   - /book/[vehicleId]           → step 1 (via BookingShell which inlines this pattern)
 *   - /reservations/[id]/confirmed → step 2 (Verify)
 *   - /reservations/[id]/check-in  → step 2B (Verify — documents)
 *   - /reservations/[id]/waiting   → step 2C (Verify — awaiting review)
 *
 * Steps are navigable via links when the reservationId is provided. The
 * current step is highlighted; done steps link back; locked steps are
 * presented but not clickable.
 */

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

// ─── Step definitions ─────────────────────────────────────────────────────────

export type JourneyStepKey = "reserve" | "verify" | "verify-docs" | "pickup";

type StepDef = {
  key: JourneyStepKey;
  n: number;
  label: string;
  /** Which main step number this belongs to (for the "Step X of 3" eyebrow) */
  mainStep: 1 | 2 | 3;
};

const STEPS: StepDef[] = [
  { key: "reserve",     n: 1, label: "Reserve",  mainStep: 1 },
  { key: "verify",      n: 2, label: "Verify",   mainStep: 2 },
  { key: "verify-docs", n: 2, label: "Verify",   mainStep: 2 },
  { key: "pickup",      n: 3, label: "Pickup",   mainStep: 3 },
];

/** Unique visible steps (de-duped by n for the stepper) */
const VISIBLE_STEPS = [
  { n: 1, label: "Reserve",  key: "reserve"     },
  { n: 2, label: "Verify",   key: "verify"      },
  { n: 3, label: "Pickup",   key: "pickup"      },
] as const;

// ─── URL helpers ──────────────────────────────────────────────────────────────

function stepUrl(key: JourneyStepKey, reservationId?: string): string | null {
  if (!reservationId) return null;
  switch (key) {
    case "reserve":     return null; // can't navigate back to booking form
    case "verify":      return `/reservations/${reservationId}/confirmed`;
    case "verify-docs": return `/reservations/${reservationId}/check-in`;
    case "pickup":      return null; // not yet a navigable page
    default:            return null;
  }
}

// ─── Stepper ─────────────────────────────────────────────────────────────────

type StepperProps = {
  currentStep: JourneyStepKey;
  reservationId?: string;
};

function JourneyStepper({ currentStep, reservationId }: StepperProps) {
  const currentDef = STEPS.find((s) => s.key === currentStep)!;
  const currentN = currentDef.n;

  return (
    <nav aria-label="Booking journey" className="mb-8">
      <ol className="flex items-center gap-0">
        {VISIBLE_STEPS.map((step, index) => {
          const isDone    = step.n < currentN;
          const isCurrent = step.n === currentN;
          const isLocked  = step.n > currentN;

          // Navigation: done steps and current verify sub-steps are linkable
          const href = isDone ? stepUrl(step.key as JourneyStepKey, reservationId)
                     : isCurrent ? null
                     : null;

          const circleClass = [
            "flex h-7 w-7 items-center justify-center rounded-full text-xs font-black transition-colors",
            isDone    ? "bg-[var(--nx-accent)] text-white"                      : "",
            isCurrent ? "bg-neutral-950 text-white"                             : "",
            isLocked  ? "border-2 border-[var(--nx-line)] bg-white text-neutral-400" : "",
          ].filter(Boolean).join(" ");

          const labelClass = [
            "text-sm font-bold transition-colors",
            isCurrent ? "text-neutral-950" : "text-neutral-400",
            isDone && href ? "hover:text-neutral-700" : "",
          ].filter(Boolean).join(" ");

          const circle = (
            <span aria-current={isCurrent ? "step" : undefined} className={circleClass}>
              {isDone ? (
                <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
              ) : (
                <span aria-hidden="true">{step.n}</span>
              )}
            </span>
          );

          const label = <span className={labelClass}>{step.label}</span>;

          const inner = (
            <div className="flex items-center gap-2">
              {isDone && href ? (
                <Link
                  href={href}
                  aria-label={`Go back to step ${step.n}: ${step.label}`}
                  className="flex items-center gap-2"
                >
                  {circle}
                  {label}
                </Link>
              ) : (
                <>
                  {circle}
                  {label}
                </>
              )}
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

// ─── Shell ────────────────────────────────────────────────────────────────────

type JourneyShellProps = {
  /** Which step this page represents */
  currentStep: JourneyStepKey;
  /** Reservation UUID — enables navigable back-links between steps */
  reservationId?: string;
  /** Page h1 */
  heading: string;
  /** Subtitle below the h1 */
  subtitle: string;
  children: React.ReactNode;
};

export function JourneyShell({
  currentStep,
  reservationId,
  heading,
  subtitle,
  children,
}: JourneyShellProps) {
  const stepDef = STEPS.find((s) => s.key === currentStep)!;
  const eyebrow = `Step ${stepDef.mainStep} of 3`;

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-10 md:py-14">
      {/* Header — identical template to BookingShell */}
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
    </section>
  );
}
