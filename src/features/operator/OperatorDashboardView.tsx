"use client";

/**
 * OperatorDashboardView - operator delivery dashboard.
 *
 * Client Component - receives pre-fetched deliveries and stats from server,
 * then subscribes to SSE updates to trigger automatic refetches.
 *
 * Layout:
 * 1. Stats cards (total, confirmed, in-progress, completed)
 * 2. Delivery queue for today
 * 3. Empty state / error state
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  Car,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  CreditCard,
  FileText,
  Search,
  XCircle,
} from "lucide-react";
import { useOperatorDeliveriesSse } from "@/hooks/useOperatorDeliveriesSse";
import { OperatorTicketScanner } from "./OperatorTicketScanner";
import {
  formatOperatorShortDate,
  formatOperatorTime,
  getOperatorBusinessDate,
} from "./datetime";
import type { DeliveryStats, DeliveryViewModel } from "./types";

function formatPickupLocation(loc: string): string {
  if (loc === "CMN_T1") return "Terminal 1";
  if (loc === "CMN_T2") return "Terminal 2";
  return loc;
}

type CaseKind =
  | "review"
  | "action"
  | "ready_today"
  | "upcoming"
  | "active"
  | "completed"
  | "payment"
  | "cancelled"
  | "past";

function getCaseKind(delivery: DeliveryViewModel, businessDate: string): CaseKind {
  const hasRejected = delivery.documents.some((d) => d.status === "REJECTED");
  const hasPendingDocs = delivery.documents.some(
    (d) => d.status === "PENDING_REVIEW",
  );
  const approved =
    delivery.documents.filter((d) => d.status === "APPROVED").length >= 2;
  const pickupBusinessDate = getOperatorBusinessDate(delivery.pickupDate);

  if (delivery.status === "CANCELLED") return "cancelled";
  if (delivery.status === "COMPLETED") return "completed";
  if (delivery.status === "IN_PROGRESS") return "active";
  if (hasRejected) return "action";
  if (hasPendingDocs) return "review";
  if (
    delivery.status === "CONFIRMED" &&
    approved &&
    pickupBusinessDate > businessDate
  ) {
    return "upcoming";
  }
  if (delivery.status === "CONFIRMED" && approved) return "ready_today";
  if (pickupBusinessDate && pickupBusinessDate < businessDate) return "past";
  return "payment";
}

function CaseBadge({ kind }: { kind: CaseKind }) {
  const config: Record<
    CaseKind,
    { label: string; icon: typeof Clock; tone: string }
  > = {
    review: {
      label: "Review docs",
      icon: Clock,
      tone: "border-amber-200 bg-amber-50 text-amber-700",
    },
    action: {
      label: "Fix docs",
      icon: AlertTriangle,
      tone: "border-red-200 bg-red-50 text-red-700",
    },
    ready_today: {
      label: "Ready today",
      icon: CheckCircle2,
      tone: "border-green-200 bg-green-50 text-green-700",
    },
    upcoming: {
      label: "Upcoming pickup",
      icon: CalendarClock,
      tone: "border-blue-200 bg-blue-50 text-blue-700",
    },
    active: {
      label: "In handoff",
      icon: Car,
      tone: "border-cyan-200 bg-cyan-50 text-cyan-700",
    },
    completed: {
      label: "Completed",
      icon: CheckCircle2,
      tone: "border-neutral-200 bg-neutral-50 text-neutral-500",
    },
    payment: {
      label: "Payment gate",
      icon: CreditCard,
      tone: "border-orange-200 bg-orange-50 text-orange-700",
    },
    cancelled: {
      label: "Cancelled",
      icon: XCircle,
      tone: "border-neutral-200 bg-neutral-50 text-neutral-500",
    },
    past: {
      label: "Past case",
      icon: Clock,
      tone: "border-neutral-200 bg-neutral-50 text-neutral-500",
    },
  };
  const Icon = config[kind].icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${config[kind].tone}`}
    >
      <Icon aria-hidden="true" className="h-3 w-3" />
      {config[kind].label}
    </span>
  );
}

function DocumentProgress({
  documents,
}: {
  documents: DeliveryViewModel["documents"];
}) {
  const totalDocs = 2;
  const approved = documents.filter((d) => d.status === "APPROVED").length;
  const pending = documents.filter((d) => d.status === "PENDING_REVIEW").length;

  return (
    <div className="mt-2 flex items-center gap-2 text-[11px] text-neutral-500">
      <FileText aria-hidden="true" className="h-3 w-3" />
      <span>{approved}/{totalDocs} approved</span>
      {pending > 0 && <span>{pending} pending</span>}
    </div>
  );
}

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
    <div className="rounded-[1.25rem] border border-neutral-200 bg-white p-5 shadow-sm">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-lg border ${TONES[tone]}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4 font-display text-[2rem] leading-none text-neutral-900">
        {value}
      </div>
      <div className="nx-meta mt-1.5 font-light text-neutral-500">{label}</div>
    </div>
  );
}

function DeliveryRow({
  delivery,
  businessDate,
}: {
  delivery: DeliveryViewModel;
  businessDate: string;
}) {
  const hasRejected = delivery.documents.some((d) => d.status === "REJECTED");
  const hasPendingDocs = delivery.documents.some(
    (d) => d.status === "PENDING_REVIEW",
  );
  const approved =
    delivery.documents.filter((d) => d.status === "APPROVED").length >= 2;
  const toHandoff = delivery.status === "CONFIRMED" && approved;
  const caseKind = getCaseKind(delivery, businessDate);
  const actionHref = `/operator/delivery/${delivery.id}`;
  const actionLabel = hasRejected
    ? "Resolve case"
    : hasPendingDocs
      ? "Open case"
      : delivery.status === "CANCELLED"
      ? "View case"
      : delivery.status === "COMPLETED"
      ? "Review"
      : delivery.status === "IN_PROGRESS"
      ? "Return"
      : toHandoff
      ? "Handoff"
      : "Manage";

  return (
    <div
      className="grid grid-cols-1 gap-3 rounded-[1.1rem] border border-neutral-200 bg-white px-5 py-4 shadow-sm transition-colors hover:border-neutral-300 lg:grid-cols-[1.1fr_1.4fr_1fr_0.9fr_auto] lg:items-center lg:gap-4"
      data-testid={`op-row-${delivery.id}`}
    >
      <div>
        <div className="text-[0.95rem] font-semibold text-neutral-900">
          {delivery.customerName}
        </div>
        <div className="nx-meta mt-0.5 font-mono text-xs text-neutral-500">
          {delivery.id.toUpperCase().slice(0, 8)}
        </div>
        <DocumentProgress documents={delivery.documents} />
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden h-9 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-neutral-200/50 bg-neutral-100 sm:flex">
          {delivery.vehicle?.licensePlate ? (
            <span className="rounded border border-neutral-200 bg-white px-1 py-0.5 font-mono text-[9px] font-bold text-neutral-700 shadow-sm">
              {delivery.vehicle.licensePlate}
            </span>
          ) : (
            <Car className="h-4 w-4 text-neutral-400" />
          )}
        </div>
        <div className="text-[0.92rem] font-medium text-neutral-800">
          {delivery.vehicle
            ? `${delivery.vehicle.brand} ${delivery.vehicle.model}`
            : "Vehicle info"}
        </div>
      </div>

      <div>
        <div className="text-[0.92rem] text-neutral-800">
          {formatOperatorShortDate(delivery.pickupDate)} &middot;{" "}
          {formatOperatorTime(delivery.pickupDate)}
        </div>
        <div className="nx-meta mt-0.5 text-xs text-neutral-500">
          CMN &middot; {formatPickupLocation(delivery.pickupLocation)}
        </div>
      </div>

      <div>
        <CaseBadge kind={caseKind} />
      </div>

      <div className="pt-2 lg:pt-0 lg:text-right">
        <Link
          href={actionHref}
          className="inline-flex items-center gap-1.5 text-[0.9rem] font-semibold text-neutral-900 transition-colors hover:text-[#1E41FC]"
        >
          {actionLabel}{" "}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

type OperatorDashboardViewProps = {
  operatorName: string;
  deliveries: DeliveryViewModel[];
  stats: DeliveryStats;
};

export function OperatorDashboardView({
  operatorName,
  deliveries,
  stats,
}: OperatorDashboardViewProps) {
  const connectionState = useOperatorDeliveriesSse();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const metrics = useMemo(() => {
    const review = deliveries.filter((d) =>
      d.documents.some((doc) => doc.status === "PENDING_REVIEW"),
    ).length;
    const action = deliveries.filter((d) =>
      d.documents.some((doc) => doc.status === "REJECTED"),
    ).length;
    const payment = deliveries.filter((d) => getCaseKind(d, stats.date) === "payment").length;
    const readyToday = deliveries.filter(
      (d) => getCaseKind(d, stats.date) === "ready_today",
    ).length;
    const upcoming = deliveries.filter(
      (d) => getCaseKind(d, stats.date) === "upcoming",
    ).length;
    const active = deliveries.filter((d) => d.status === "IN_PROGRESS").length;
    const completed = deliveries.filter((d) => d.status === "COMPLETED").length;
    const cancelled = deliveries.filter((d) => d.status === "CANCELLED").length;
    const past = deliveries.filter((d) =>
      ["past", "completed", "cancelled"].includes(getCaseKind(d, stats.date)),
    ).length;

    return {
      total: deliveries.length,
      review,
      action,
      payment,
      readyToday,
      upcoming,
      active,
      past,
      completed,
      cancelled,
    };
  }, [deliveries, stats.date]);

  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((d) => {
      const hasRejected = d.documents.some((doc) => doc.status === "REJECTED");
      const pending = d.documents.some(
        (doc) => doc.status === "PENDING_REVIEW",
      );
      const caseKind = getCaseKind(d, stats.date);

      if (filter === "under_review" && !pending) return false;
      if (filter === "action_required" && !hasRejected) return false;
      if (filter === "payment_gate" && caseKind !== "payment") return false;
      if (filter === "ready_today" && caseKind !== "ready_today") return false;
      if (filter === "upcoming" && caseKind !== "upcoming") return false;
      if (filter === "active" && d.status !== "IN_PROGRESS") return false;
      if (filter === "completed" && d.status !== "COMPLETED") return false;
      if (filter === "cancelled" && d.status !== "CANCELLED") return false;
      if (filter === "past" && !["past", "completed", "cancelled"].includes(caseKind)) return false;

      if (!query.trim()) return true;

      const q = query.toLowerCase();
      const nameMatch = d.customerName.toLowerCase().includes(q);
      const refMatch = d.id.toLowerCase().includes(q);
      const phoneMatch = d.customerPhone.toLowerCase().includes(q);
      const vehicleMatch = d.vehicle
        ? `${d.vehicle.brand} ${d.vehicle.model} ${d.vehicle.licensePlate}`
            .toLowerCase()
            .includes(q)
        : false;

      return nameMatch || refMatch || phoneMatch || vehicleMatch;
    });
  }, [deliveries, filter, query, stats.date]);

  const filters = [
    { id: "all", label: "All cases", count: metrics.total },
    { id: "under_review", label: "To review", count: metrics.review },
    { id: "action_required", label: "Action required", count: metrics.action },
    { id: "payment_gate", label: "Payment gate", count: metrics.payment },
    { id: "ready_today", label: "Ready today", count: metrics.readyToday },
    { id: "active", label: "Active", count: metrics.active },
    { id: "upcoming", label: "Upcoming", count: metrics.upcoming },
    { id: "past", label: "Past", count: metrics.past },
    { id: "completed", label: "Completed", count: metrics.completed },
    { id: "cancelled", label: "Cancelled", count: metrics.cancelled },
  ];

  return (
    <section className="nx-container max-w-[1100px] space-y-8 py-10 md:py-14">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="nx-eyebrow font-medium text-neutral-500">
            Operations console
          </span>
          <h1 className="nx-h2 mt-2 font-display font-light text-neutral-900">
            Pickup &amp; verification console
          </h1>
          <p className="mt-1 text-xs font-light text-neutral-400">
            {operatorName ? `Signed in as ${operatorName} - ` : null}
            Business date: {stats.date}. Showing the complete operator case ledger.
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-right shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Review model
          </p>
          <p className="mt-1 text-xs font-semibold text-neutral-800">
            Scan, search, or filter first. Decide inside the reservation case.
          </p>
        </div>
      </header>

      <div
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
        aria-label="Today's reservation statistics"
      >
        <Metric
          icon={ClipboardCheck}
          tone="amber"
          label="Awaiting review"
          value={metrics.review}
        />
        <Metric
          icon={AlertTriangle}
          tone="red"
          label="Action required"
          value={metrics.action}
        />
        <Metric
          icon={CreditCard}
          tone="emerald"
          label="Payment gate"
          value={metrics.payment}
        />
        <Metric
          icon={Car}
          tone="neutral"
          label="Active rentals"
          value={metrics.active}
        />
      </div>

      <OperatorTicketScanner />

      <div className="flex flex-col gap-4 border-t border-neutral-100 pt-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                filter === item.id
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400 hover:text-neutral-900"
              }`}
            >
              {item.label}
              <span
                className={`ml-2 rounded-full px-1.5 py-0.5 font-mono text-[10px] ${
                  filter === item.id ? "bg-white/15" : "bg-neutral-100"
                }`}
              >
                {item.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            aria-label="Search deliveries"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ref, customer, vehicle..."
            className="nx-input rounded-full py-2.5 pl-10 text-xs"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="nx-label hidden grid-cols-[1.1fr_1.4fr_1fr_0.9fr_auto] gap-4 px-5 pb-1 text-neutral-400 lg:grid">
          <span>Customer</span>
          <span>Vehicle</span>
          <span>Pickup</span>
          <span>Status</span>
          <span className="text-right">Action</span>
        </div>

        {filteredDeliveries.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-neutral-200 bg-white py-16 text-center shadow-sm">
            <CheckCircle2
              aria-hidden="true"
              className="h-10 w-10 stroke-1 text-neutral-300"
            />
            <p className="mt-4 text-sm font-semibold text-neutral-900">
              No reservations match
            </p>
            <p className="mt-1 text-xs font-light text-neutral-400">
              Adjust your filters or search query to see reservations.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDeliveries.map((delivery) => (
              <DeliveryRow
                key={delivery.id}
                delivery={delivery}
                businessDate={stats.date}
              />
            ))}
          </div>
        )}
      </div>

      <div
        className={`flex w-fit items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-semibold ${
          connectionState === "live"
            ? "border-green-200 bg-green-50/50 text-green-700"
            : connectionState === "fallback"
              ? "border-amber-200 bg-amber-50 text-amber-800"
              : "border-neutral-200 bg-neutral-50 text-neutral-700"
        }`}
      >
        <span className="relative flex h-2 w-2">
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
              connectionState === "live"
                ? "animate-ping bg-green-400"
                : "bg-current"
            }`}
          />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
        </span>
        {connectionState === "live"
          ? "Live delivery updates active"
          : connectionState === "fallback"
            ? "Live stream unavailable - auto-refresh fallback active"
            : "Reconnecting delivery updates"}
      </div>
    </section>
  );
}
