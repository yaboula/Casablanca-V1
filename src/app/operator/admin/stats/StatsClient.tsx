"use client";

import type { AdminStats } from "./page";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING_DEPOSIT:    { label: "Depósito pendiente", color: "bg-amber-400" },
  AWAITING_CAPTURE:  { label: "Captura pendiente",  color: "bg-yellow-400" },
  CONFIRMED:         { label: "Confirmadas",         color: "bg-emerald-500" },
  IN_PROGRESS:       { label: "En curso",            color: "bg-blue-500" },
  COMPLETED:         { label: "Completadas",         color: "bg-slate-500" },
  CANCELLED_BY_USER: { label: "Cancel. cliente",    color: "bg-red-400" },
  CANCELLED_BY_OPERATOR: { label: "Cancel. operador", color: "bg-red-600" },
  EXPIRED:           { label: "Expiradas",           color: "bg-slate-300" },
};

const CATEGORY_LABELS: Record<string, string> = {
  SEDAN: "Sedán", SUV: "SUV", LUXURY: "Luxury", COMPACT: "Compact",
};

export default function StatsClient({ stats }: { stats: AdminStats }) {
  const { kpi, bookingsByStatus, weeklyTrend, topVehicles } = stats;
  const totalEUR = (kpi.totalRevenueEurCents / 100).toLocaleString("es-ES", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const maxBookings = Math.max(...(weeklyTrend.map((w) => w.bookings) ?? [1]), 1);
  const maxStatusCount = Math.max(...bookingsByStatus.map((s) => s.count), 1);

  return (
    <div className="max-w-lg mx-auto px-5 pt-6 pb-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Estadísticas</h1>
          <p className="text-sm text-slate-500">Vista global de la plataforma</p>
        </div>
        <span className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-700 text-xs font-bold px-2.5 py-1 rounded-full border border-violet-200">
          ADMIN
        </span>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3">
        <KpiCard label="Ingresos totales" value={`${totalEUR} €`} accent="emerald" />
        <KpiCard label="Reservas totales" value={String(kpi.totalBookings)} accent="blue" />
        <KpiCard label="Usuarios activos" value={String(kpi.activeUsers)} accent="violet" />
        <KpiCard label="Vehículos activos" value={String(kpi.activeVehicles)} accent="amber" />
      </div>

      {/* Bookings by status */}
      <Section title="Reservas por estado">
        <div className="space-y-3">
          {bookingsByStatus.map((s) => {
            const meta = STATUS_LABELS[s.status] ?? { label: s.status, color: "bg-slate-400" };
            const pct = Math.round((s.count / maxStatusCount) * 100);
            return (
              <div key={s.status}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-slate-700">{meta.label}</span>
                  <span className="text-sm font-bold text-slate-900 tabular-nums">{s.count}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${meta.color}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Weekly trend */}
      {weeklyTrend.length > 0 && (
        <Section title="Tendencia semanal (4 semanas)">
          <div className="flex items-end gap-2 h-24">
            {weeklyTrend.map((w) => {
              const heightPct = Math.max(8, Math.round((w.bookings / maxBookings) * 100));
              const weekLabel = new Date(w.week + "T12:00:00Z").toLocaleDateString("es-ES", {
                day: "numeric", month: "short",
              });
              return (
                <div key={w.week} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-bold text-slate-700 tabular-nums">{w.bookings}</span>
                  <div
                    className="w-full bg-blue-500 rounded-t-md transition-all"
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-[9px] text-slate-400">{weekLabel}</span>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Top vehicles */}
      <Section title="Top 5 vehículos">
        <div className="space-y-2">
          {topVehicles.map((v, i) => (
            <div key={v.id} className="flex items-center gap-3">
              <span className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-50 text-blue-700 text-xs font-black shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {v.brand} {v.model}
                </p>
                <p className="text-xs text-slate-500">{CATEGORY_LABELS[v.category] ?? v.category}</p>
              </div>
              <span className="text-sm font-bold text-slate-700 tabular-nums">
                {v.bookings} res.
              </span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function KpiCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "emerald" | "blue" | "violet" | "amber";
}) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    blue:    "bg-blue-50 text-blue-700 border-blue-100",
    violet:  "bg-violet-50 text-violet-700 border-violet-100",
    amber:   "bg-amber-50 text-amber-700 border-amber-100",
  };
  return (
    <div className={`rounded-2xl border p-4 ${colors[accent]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className="text-2xl font-black tabular-nums mt-1">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">{title}</p>
      {children}
    </div>
  );
}
