import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  MapPin,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import type {
  ReservationTicketViewModel,
  ReservationViewModel,
} from "@/features/reservations/types";
import type { TicketReadyState } from "./types";
import { SmartTicketQrPanel } from "./SmartTicketQrPanel";

function formatPickupLocation(loc: string | null): string {
  if (loc === "CMN_T1") return "Terminal 1";
  if (loc === "CMN_T2") return "Terminal 2";
  return "Casablanca Mohammed V Airport";
}

function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "Africa/Casablanca",
  }).format(new Date(iso));
}

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Casablanca",
  }).format(new Date(iso));
}

function formatExpiry(iso: string | null | undefined): string | null {
  if (!iso) return null;

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Casablanca",
  }).format(new Date(iso));
}

function formatManualCode(reservationId: string): string {
  const compact = reservationId.replace(/-/g, "").toUpperCase().slice(0, 8);
  return compact.replace(/(.{4})/g, "$1 ").trim();
}

function deriveTicketState(reservation: ReservationViewModel): TicketReadyState {
  if (reservation.status === "CANCELLED") return "cancelled";
  if (
    reservation.status === "CONFIRMED" &&
    reservation.depositStatus === "CAPTURED"
  ) {
    return "ready";
  }
  return "not_ready";
}

type SmartTicketViewProps = {
  reservation: ReservationViewModel;
  ticket: ReservationTicketViewModel | null;
  ticketState?: TicketReadyState;
};

export function SmartTicketView({
  reservation,
  ticket,
  ticketState: ticketStateOverride,
}: SmartTicketViewProps) {
  const ticketState = ticketStateOverride ?? deriveTicketState(reservation);
  const ready = ticketState === "ready";
  const expiresAt = formatExpiry(ticket?.expiresAt);
  const manualCode = formatManualCode(reservation.id);
  const vehicleName = reservation.vehicle?.name || "Premium vehicle";

  return (
    <article className="mx-auto w-full max-w-6xl px-5 py-8 md:px-8 md:py-12">
      <header className="mx-auto max-w-3xl text-center">
        <span className="nx-eyebrow font-medium text-neutral-500">
          Smart ticket
        </span>
        <h1 className="mt-3 font-display text-4xl font-light leading-tight text-neutral-950 md:text-5xl">
          {ready
            ? "Pickup pass ready"
            : ticketState === "cancelled"
              ? "Reservation cancelled"
              : ticketState === "revoked"
                ? "Ticket revoked"
                : ticketState === "expired"
                  ? "Ticket expired"
                  : "Ticket not ready yet"}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-neutral-600 md:text-lg">
          {ready
            ? "Show this pass at arrivals. The operator scans the QR, checks your identity, and releases the keys."
            : ticketState === "revoked"
              ? "This ticket was revoked by operations and can no longer be used for pickup."
              : ticketState === "expired"
                ? "This ticket expired. Refresh the page to request a current pickup pass."
                : "Your ticket appears after the reservation is confirmed and the deposit capture succeeds."}
        </p>
      </header>

      {(ticketState === "not_ready" ||
        ticketState === "expired" ||
        ticketState === "revoked") && (
        <TicketUnavailableState
          reservationId={reservation.id}
          state={ticketState}
        />
      )}

      {ticketState === "cancelled" && <CancelledState />}

      {ready && ticket && (
        <div className="mt-10 space-y-6">
          <div className="mx-auto flex max-w-3xl items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-950">
            <CheckCircle2
              aria-hidden="true"
              className="h-5 w-5 shrink-0 text-emerald-600"
            />
            <p className="text-sm font-semibold">
              Reservation confirmed. Keep this screen open when you reach CMN.
            </p>
          </div>

          <section
            className="overflow-hidden rounded-3xl border border-neutral-200 bg-white"
            data-testid="smart-ticket"
            aria-label="Smart pickup ticket"
          >
            <div className="grid gap-0 lg:grid-cols-[minmax(20rem,0.95fr)_1.2fr]">
              <div className="bg-neutral-950 p-5 text-white sm:p-7 lg:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#1E41FC]" />
                    <span className="font-display text-xl font-medium">
                      Nexus<span className="text-neutral-500">/Car</span>
                    </span>
                  </div>
                  <span className="rounded bg-[#1E41FC] px-2 py-1 font-mono text-xs font-bold tracking-[0.18em] text-white">
                    {manualCode.replace(" ", "")}
                  </span>
                </div>

                <div className="mt-8">
                  <SmartTicketQrPanel
                    ticketToken={ticket.ticketToken}
                    manualCode={manualCode}
                    expiresLabel={expiresAt}
                  />
                </div>
              </div>

              <div className="p-5 sm:p-7 lg:p-8">
                <div className="flex flex-col gap-5 border-b border-neutral-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">
                      Vehicle
                    </p>
                    <h2 className="mt-1 font-display text-3xl font-semibold leading-tight text-neutral-950">
                      {vehicleName}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                      Your operator will match this reservation with the vehicle
                      assigned in the pickup system.
                    </p>
                  </div>
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-800">
                    <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
                    Verified
                  </span>
                </div>

                <dl className="mt-6 grid gap-3 sm:grid-cols-2">
                  <TicketFact
                    icon={MapPin}
                    label="Pickup point"
                    value="CMN arrivals"
                    helper={formatPickupLocation(reservation.pickupLocation)}
                  />
                  <TicketFact
                    icon={CalendarDays}
                    label="Pickup time"
                    value={formatShortDate(reservation.pickupDate)}
                    helper={formatTime(reservation.pickupDate)}
                  />
                </dl>

                <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-sm font-semibold text-neutral-950">
                    Pickup steps
                  </p>
                  <ol className="mt-3 space-y-3 text-sm leading-relaxed text-neutral-700">
                    <li className="flex gap-3">
                      <StepNumber>1</StepNumber>
                      Open the enlarged QR before reaching the counter.
                    </li>
                    <li className="flex gap-3">
                      <StepNumber>2</StepNumber>
                      Keep your passport and driving licence ready.
                    </li>
                    <li className="flex gap-3">
                      <StepNumber>3</StepNumber>
                      If scanning fails, give the manual code to the operator.
                    </li>
                  </ol>
                </div>

                <div className="mt-5 grid gap-3 text-xs leading-relaxed text-neutral-600 sm:grid-cols-2">
                  <TrustNote title="Secure token">
                    The QR contains a signed pickup token, not payment details.
                  </TrustNote>
                  <TrustNote title="Identity check">
                    The ticket is valid only with your matching documents.
                  </TrustNote>
                </div>

                {expiresAt && (
                  <p className="mt-5 text-xs font-medium text-neutral-500">
                    Ticket valid until {expiresAt} Casablanca time.
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      <footer className="mt-8 flex flex-col gap-4 border-t border-neutral-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <Link
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 transition-colors hover:text-neutral-950"
          href={`/reservations/${reservation.id}/waiting`}
        >
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
          Back to waiting room
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <span
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-5 text-xs font-semibold text-neutral-600"
            aria-disabled="true"
          >
            <Wallet aria-hidden="true" className="h-4 w-4 text-[#1E41FC]" />
            Wallet export soon
          </span>
          <Link
            className="inline-flex h-10 items-center justify-center rounded-full border border-neutral-950 bg-neutral-950 px-5 text-xs font-semibold text-white transition-colors hover:bg-neutral-800"
            href="/dashboard"
          >
            Go to dashboard
          </Link>
        </div>
      </footer>
    </article>
  );
}

function TicketFact({
  icon: Icon,
  label,
  value,
  helper,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <dt className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">
        <Icon aria-hidden="true" className="h-3.5 w-3.5 text-[#1E41FC]" />
        {label}
      </dt>
      <dd className="mt-2 text-base font-semibold text-neutral-950">{value}</dd>
      <dd className="mt-1 text-xs text-neutral-600">{helper}</dd>
    </div>
  );
}

function StepNumber({ children }: { children: string }) {
  return (
    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-[11px] font-bold text-white">
      {children}
    </span>
  );
}

function TrustNote({
  title,
  children,
}: {
  title: string;
  children: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <p className="font-semibold text-neutral-950">{title}</p>
      <p className="mt-1">{children}</p>
    </div>
  );
}

function TicketUnavailableState({
  reservationId,
  state,
}: {
  reservationId: string;
  state: TicketReadyState;
}) {
  const revoked = state === "revoked";

  return (
    <div
      className={`mx-auto mt-10 flex max-w-2xl items-start gap-3.5 rounded-2xl border px-5 py-4 ${
        revoked ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"
      }`}
      role="status"
      aria-live="polite"
    >
      <Clock
        aria-hidden="true"
        className={`mt-0.5 h-4 w-4 shrink-0 ${
          revoked ? "text-red-600" : "text-amber-700"
        }`}
      />
      <div>
        <p
          className={`text-sm font-semibold ${
            revoked ? "text-red-950" : "text-amber-950"
          }`}
        >
          {state === "expired"
            ? "Ticket expired"
            : revoked
              ? "Ticket revoked"
              : "Ticket not available yet"}
        </p>
        <p
          className={`mt-1 text-sm leading-relaxed ${
            revoked ? "text-red-800" : "text-amber-900"
          }`}
        >
          {state === "expired"
            ? "Refresh this page to request a fresh signed ticket token."
            : revoked
              ? "Contact the operations team if you need pickup review."
              : "Return to the waiting room to follow payment capture, document review, and confirmation status."}
        </p>
        <Link
          className={`mt-4 inline-flex h-10 items-center justify-center rounded-full px-4 text-xs font-semibold text-white transition ${
            revoked ? "bg-red-700 hover:bg-red-800" : "bg-amber-950 hover:bg-neutral-800"
          }`}
          href={`/reservations/${reservationId}/waiting`}
        >
          Go to waiting room
        </Link>
      </div>
    </div>
  );
}

function CancelledState() {
  return (
    <div
      className="mx-auto mt-10 flex max-w-2xl items-start gap-3.5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4"
      role="alert"
    >
      <AlertTriangle
        aria-hidden="true"
        className="mt-0.5 h-4 w-4 shrink-0 text-red-600"
      />
      <div>
        <p className="text-sm font-semibold text-red-950">
          Reservation cancelled
        </p>
        <p className="mt-1 text-sm leading-relaxed text-red-800">
          This reservation has been cancelled and no pickup ticket is available.
        </p>
        <Link
          className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-neutral-950 px-4 text-xs font-semibold text-white transition hover:bg-neutral-800"
          href="/catalog"
        >
          Browse vehicles
        </Link>
      </div>
    </div>
  );
}
