"use client";

/**
 * OperatorDashboardView — operator delivery dashboard.
 *
 * Client Component — receives pre-fetched deliveries and stats from server,
 * then subscribes to SSE updates to trigger automatic refetches.
 *
 * Layout:
 * 1. Stats cards (total, confirmed, in-progress, completed)
 * 2. Delivery queue for today
 * 3. Empty state / error state
 */


import Link from "next/link";
import {
  Car,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CalendarDays,
  MapPin,
  FileText,
  User,
  ArrowRight,
} from "lucide-react";
import { useOperatorDeliveriesSse } from "@/hooks/useOperatorDeliveriesSse";
import type { DeliveryViewModel, DeliveryStats } from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return iso;
  }
}

function formatTime(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatPickupLocation(loc: string): string {
  if (loc === "CMN_T1") return "Terminal 1";
  if (loc === "CMN_T2") return "Terminal 2";
  return loc;
}

// ---------------------------------------------------------------------------
// Doc readiness badge
// ---------------------------------------------------------------------------

function DocReadinessBadge({ documents }: { documents: DeliveryViewModel["documents"] }) {
  const totalDocs = 2; // PASSPORT + DRIVING_LICENSE always required
  const approved = documents.filter((d) => d.status === "APPROVED").length;
  const hasRejected = documents.some((d) => d.status === "REJECTED");
  const pending = documents.filter((d) => d.status === "PENDING_REVIEW").length;

  if (hasRejected) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-700">
        <AlertTriangle aria-hidden="true" className="h-3 w-3" />
        Doc rejected
      </span>
    );
  }
  if (approved >= totalDocs) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[11px] font-bold text-green-700">
        <CheckCircle2 aria-hidden="true" className="h-3 w-3" />
        Docs ready
      </span>
    );
  }
  if (pending > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
        <Clock aria-hidden="true" className="h-3 w-3" />
        {pending} pending
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] font-bold text-neutral-500">
      <FileText aria-hidden="true" className="h-3 w-3" />
      No docs
    </span>
  );
}

// ---------------------------------------------------------------------------
// Stats card
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  description,
  accent,
}: {
  label: string;
  value: number;
  description?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--nx-line)] bg-white p-5">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">
        {label}
      </p>
      <p
        className={`mt-2 text-3xl font-black ${accent ?? "text-neutral-950"}`}
        aria-label={`${label}: ${value}`}
      >
        {value}
      </p>
      {description && (
        <p className="mt-0.5 text-xs text-neutral-400">{description}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delivery row
// ---------------------------------------------------------------------------

function DeliveryRow({ delivery }: { delivery: DeliveryViewModel }) {
  return (
    <li className="flex flex-col gap-3 py-5 sm:flex-row sm:items-start sm:justify-between">
      {/* Left: customer + vehicle */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-neutral-100">
          <Car aria-hidden="true" className="h-5 w-5 text-neutral-500" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-black text-neutral-950">
              {delivery.vehicle
                ? `${delivery.vehicle.brand} ${delivery.vehicle.model}`
                : "Vehicle"}
            </p>
            {delivery.vehicle?.licensePlate && (
              <span className="rounded border border-[var(--nx-line)] bg-neutral-50 px-1.5 py-0.5 font-mono text-[11px] text-neutral-600">
                {delivery.vehicle.licensePlate}
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
            <span className="flex items-center gap-1">
              <User aria-hidden="true" className="h-3 w-3" />
              {delivery.customerName}
            </span>
            {delivery.customerPhone && (
              <span>{delivery.customerPhone}</span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-neutral-400">
            <span className="flex items-center gap-1">
              <CalendarDays aria-hidden="true" className="h-3 w-3" />
              {formatDate(delivery.pickupDate)} at {formatTime(delivery.pickupDate)}
            </span>
            <span className="flex items-center gap-1">
              <MapPin aria-hidden="true" className="h-3 w-3" />
              CMN — {formatPickupLocation(delivery.pickupLocation)}
            </span>
          </div>
        </div>
      </div>

      {/* Right: badges + balance + CTA */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end">
        <DocReadinessBadge documents={delivery.documents} />
        <div className="text-right">
          <p className="text-xs text-neutral-400">Balance due</p>
          <p className="text-sm font-black text-neutral-950">
            €{delivery.balanceDueEUR.toFixed(2)}
          </p>
        </div>
        {/* Link to future delivery detail route (Commit M) */}
        <Link
          href={`/operator/delivery/${delivery.id}`}
          className="inline-flex min-h-8 items-center gap-1 rounded-md border border-[var(--nx-line)] bg-white px-3 text-xs font-bold text-neutral-950 transition hover:bg-neutral-50"
          aria-label={`View delivery details for ${delivery.customerName}`}
        >
          Details <ArrowRight aria-hidden="true" className="h-3 w-3" />
        </Link>
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type OperatorDashboardViewProps = {
  operatorName: string;
  deliveries: DeliveryViewModel[];
  stats: DeliveryStats;
};

// ---------------------------------------------------------------------------
// OperatorDashboardView
// ---------------------------------------------------------------------------

export function OperatorDashboardView({
  operatorName,
  deliveries,
  stats,
}: OperatorDashboardViewProps) {
  // Subscribe to live delivery updates. Calls router.refresh() automatically.
  useOperatorDeliveriesSse();

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-10 md:py-14">
      {/* Header */}
      <header className="mb-10 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-neutral-500">
            Operator console
          </p>
          <h1 className="mt-2 text-4xl font-black text-neutral-950">
            Delivery dashboard
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {operatorName && `Signed in as ${operatorName} · `}
            {stats.date}
          </p>
        </div>
        <Link
          href="/operator/documents"
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-5 text-sm font-bold text-amber-900 transition hover:bg-amber-100"
        >
          <FileText aria-hidden="true" className="h-4 w-4" />
          Document review queue
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </header>

      {/* Stats cards */}
      <div
        className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4"
        aria-label="Today's delivery statistics"
      >
        <StatCard
          label="Total today"
          value={stats.total}
          description="Confirmed + in progress + completed"
        />
        <StatCard
          label="Confirmed"
          value={stats.confirmed}
          description="Awaiting handoff"
          accent="text-blue-700"
        />
        <StatCard
          label="In progress"
          value={stats.inProgress}
          description="Vehicle handed over"
          accent="text-green-700"
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          description="Vehicle returned"
          accent="text-neutral-500"
        />
      </div>

      {/* Delivery queue */}
      <div className="rounded-lg border border-[var(--nx-line)] bg-white">
        <div className="flex items-center justify-between gap-4 border-b border-[var(--nx-line)] px-6 py-4">
          <h2 className="text-sm font-black text-neutral-950">
            Today&apos;s delivery queue
          </h2>
          {deliveries.length > 0 && (
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-black text-blue-800">
              {deliveries.length}
            </span>
          )}
        </div>

        {/* Empty state */}
        {deliveries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CheckCircle2
              aria-hidden="true"
              className="h-10 w-10 text-neutral-300"
            />
            <p className="mt-4 text-sm font-black text-neutral-950">
              No deliveries today
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              No confirmed reservations with today&apos;s pickup date.
            </p>
          </div>
        )}

        {/* Delivery rows */}
        {deliveries.length > 0 && (
          <ul
            className="divide-y divide-[var(--nx-line)] px-6"
            aria-label="Delivery queue"
          >
            {deliveries.map((delivery) => (
              <DeliveryRow key={delivery.id} delivery={delivery} />
            ))}
          </ul>
        )}
      </div>

      {/* SSE note */}
      <p className="mt-6 flex items-center gap-2 text-xs font-bold text-green-700 bg-green-50 px-4 py-2 rounded-md border border-green-200 w-fit">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        Live delivery updates active
      </p>
    </section>
  );
}
