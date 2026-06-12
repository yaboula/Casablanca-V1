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


import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Car,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  ArrowRight,
  Search,
  CalendarClock,
  ClipboardCheck,
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
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[10px] font-bold text-red-700 uppercase tracking-wider">
        <AlertTriangle aria-hidden="true" className="h-3 w-3" />
        Fix docs
      </span>
    );
  }
  if (approved >= totalDocs) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-[10px] font-bold text-green-700 uppercase tracking-wider">
        <CheckCircle2 aria-hidden="true" className="h-3 w-3" />
        Ready
      </span>
    );
  }
  if (pending > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 uppercase tracking-wider">
        <Clock aria-hidden="true" className="h-3 w-3" />
        To review
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
      <FileText aria-hidden="true" className="h-3 w-3" />
      No docs
    </span>
  );
}

// ---------------------------------------------------------------------------
// Stats card
// ---------------------------------------------------------------------------

const TONES = {
  amber: "bg-amber-50 text-amber-600 border-amber-100",
  red: "bg-red-50 text-red-500 border-red-100",
  emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
  neutral: "bg-neutral-50 text-neutral-500 border-neutral-100",
};

function Metric({
  icon: Icon,
  tone,
  label,
  value,
}: {
  icon: typeof Car;
  tone: keyof typeof TONES;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-white border border-neutral-200 rounded-[1.25rem] p-5 shadow-sm">
      <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${TONES[tone]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="font-display text-[2rem] font-light text-neutral-900 mt-4 leading-none">{value}</div>
      <div className="nx-meta text-neutral-500 mt-1.5 font-light">{label}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delivery row
// ---------------------------------------------------------------------------

function DeliveryRow({ delivery }: { delivery: DeliveryViewModel }) {
  const status = delivery.status;
  const approved = delivery.documents.filter((d) => d.status === "APPROVED").length >= 2;
  const toHandoff = status === "CONFIRMED" && approved;

  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.4fr_1fr_0.9fr_auto] gap-3 lg:gap-4 lg:items-center bg-white border border-neutral-200 rounded-[1.1rem] px-5 py-4 hover:border-neutral-300 transition-colors shadow-sm"
      data-testid={`op-row-${delivery.id}`}
    >
      <div>
        <div className="text-[0.95rem] font-semibold text-neutral-900">
          {delivery.customerName}
        </div>
        <div className="nx-meta text-neutral-500 font-mono text-xs mt-0.5">
          {delivery.id.toUpperCase().slice(0, 8)}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-12 h-9 rounded-md overflow-hidden bg-neutral-100 shrink-0 hidden sm:flex items-center justify-center border border-neutral-200/50">
          {delivery.vehicle?.licensePlate ? (
            <span className="font-mono text-[9px] font-bold text-neutral-700 bg-white border border-neutral-200 px-1 py-0.5 rounded shadow-sm">
              {delivery.vehicle.licensePlate}
            </span>
          ) : (
            <Car className="w-4 h-4 text-neutral-400" />
          )}
        </div>
        <div className="text-[0.92rem] text-neutral-800 font-medium">
          {delivery.vehicle ? `${delivery.vehicle.brand} ${delivery.vehicle.model}` : "Vehicle Info"}
        </div>
      </div>
      <div>
        <div className="text-[0.92rem] text-neutral-800">
          {formatDate(delivery.pickupDate)} &middot; {formatTime(delivery.pickupDate)}
        </div>
        <div className="nx-meta text-neutral-500 text-xs mt-0.5">
          CMN &middot; {formatPickupLocation(delivery.pickupLocation)}
        </div>
      </div>
      <div>
        <DocReadinessBadge documents={delivery.documents} />
      </div>
      <div className="lg:text-right pt-2 lg:pt-0">
        <Link
          href={`/operator/delivery/${delivery.id}`}
          className="inline-flex items-center gap-1.5 text-[0.9rem] font-semibold text-neutral-900 hover:text-[#1E41FC] transition-colors"
        >
          {toHandoff ? "Handoff" : "Manage"} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
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
  const connectionState = useOperatorDeliveriesSse();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const metrics = useMemo(() => {
    const total = deliveries.length;
    const review = deliveries.filter((d) => d.documents.some((doc) => doc.status === "PENDING_REVIEW")).length;
    const action = deliveries.filter((d) => d.documents.some((doc) => doc.status === "REJECTED")).length;
    const readyCount = deliveries.filter((d) => d.status === "CONFIRMED" && d.documents.filter((doc) => doc.status === "APPROVED").length >= 2).length;

    return { total, review, action, readyCount };
  }, [deliveries]);

  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((d) => {
      // 1. Filter by tabs
      const hasRejected = d.documents.some((doc) => doc.status === "REJECTED");
      const pending = d.documents.some((doc) => doc.status === "PENDING_REVIEW");
      const approvedCount = d.documents.filter((doc) => doc.status === "APPROVED").length;
      const docsReady = approvedCount >= 2;

      if (filter === "under_review" && !pending) return false;
      if (filter === "action_required" && !hasRejected) return false;
      if (filter === "approved" && (!docsReady || d.status !== "CONFIRMED")) return false;
      if (filter === "completed" && d.status !== "COMPLETED") return false;

      // 2. Filter by search input query
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      const nameMatch = d.customerName.toLowerCase().includes(q);
      const refMatch = d.id.toLowerCase().includes(q);
      const vehicleMatch = d.vehicle ? `${d.vehicle.brand} ${d.vehicle.model}`.toLowerCase().includes(q) : false;
      return nameMatch || refMatch || vehicleMatch;
    });
  }, [deliveries, filter, query]);

  const FILTERS = [
    { id: "all", label: "All" },
    { id: "under_review", label: "To review" },
    { id: "action_required", label: "Action required" },
    { id: "approved", label: "Ready" },
    { id: "completed", label: "Completed" },
  ];

  return (
    <section className="nx-container py-10 md:py-14 space-y-8 max-w-[1100px]">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="nx-eyebrow text-neutral-500 font-medium">Operations console</span>
          <h1 className="nx-h2 font-display font-light text-neutral-900 mt-2">
            Pickup &amp; verification console
          </h1>
          <p className="mt-1 text-xs text-neutral-400 font-light">
            {operatorName && `Signed in as ${operatorName} · `}
            Today: {stats.date}
          </p>
        </div>
        <Link
          href="/operator/documents"
          className="nx-btn-primary inline-flex h-11 items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-6 text-xs font-bold uppercase tracking-wider text-amber-900 transition hover:bg-amber-100 shadow-sm"
        >
          <FileText aria-hidden="true" className="h-4 w-4" />
          Document review queue
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </header>

      {/* Metrics Grid */}
      <div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        aria-label="Today's reservation statistics"
      >
        <Metric icon={ClipboardCheck} tone="amber" label="Awaiting review" value={metrics.review} />
        <Metric icon={AlertTriangle} tone="red" label="Action required" value={metrics.action} />
        <Metric icon={CalendarClock} tone="emerald" label="Ready for pickup" value={metrics.readyCount} />
        <Metric icon={Car} tone="neutral" label="Total reservations" value={metrics.total} />
      </div>

      {/* Toolbar: Filters and Search */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-t border-neutral-100 pt-6">
        <div className="flex items-center gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border transition-all ${
                filter === f.id
                  ? "bg-neutral-900 text-white border-neutral-900"
                  : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400 hover:text-neutral-900"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ref, customer, vehicle..."
            className="nx-input pl-10 text-xs py-2.5 rounded-full"
          />
        </div>
      </div>

      {/* List Container */}
      <div className="space-y-4">
        {/* Table headers (Desktop) */}
        <div className="hidden lg:grid grid-cols-[1.1fr_1.4fr_1fr_0.9fr_auto] gap-4 px-5 pb-1 nx-label text-neutral-400">
          <span>Customer</span>
          <span>Vehicle</span>
          <span>Pickup</span>
          <span>Status</span>
          <span className="text-right">Action</span>
        </div>

        {/* Empty state */}
        {filteredDeliveries.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-neutral-200 bg-white py-16 text-center shadow-sm">
            <CheckCircle2
              aria-hidden="true"
              className="h-10 w-10 text-neutral-300 stroke-1"
            />
            <p className="mt-4 text-sm font-semibold text-neutral-900">
              No reservations match
            </p>
            <p className="mt-1 text-xs text-neutral-400 font-light">
              Adjust your filters or search query to see reservations.
            </p>
          </div>
        )}

        {/* List items */}
        {filteredDeliveries.length > 0 && (
          <div className="space-y-3">
            {filteredDeliveries.map((delivery) => (
              <DeliveryRow key={delivery.id} delivery={delivery} />
            ))}
          </div>
        )}
      </div>

      {/* Connection Indicator Footer */}
      <div
        className={`flex items-center gap-2 px-4 py-2.5 rounded-full border w-fit text-xs font-semibold ${
          connectionState === "live"
            ? "text-green-700 bg-green-50/50 border-green-200"
            : connectionState === "fallback"
              ? "text-amber-800 bg-amber-50 border-amber-200"
              : "text-neutral-700 bg-neutral-50 border-neutral-200"
        }`}
      >
        <span className="relative flex h-2 w-2">
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
              connectionState === "live" ? "animate-ping bg-green-400" : "bg-current"
            }`}
          />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
        </span>
        {connectionState === "live"
          ? "Live delivery updates active"
          : connectionState === "fallback"
            ? "Live stream unavailable — auto-refresh fallback active"
            : "Reconnecting delivery updates"}
      </div>
    </section>
  );
}
