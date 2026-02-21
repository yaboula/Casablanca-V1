import type { Metadata } from "next";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { serverFetch } from "@/lib/server-api";
import type { OperatorDelivery } from "@/types";
import DeliveryListClient from "./DeliveryListClient";

export const metadata: Metadata = {
  title: "Panel Operador Â· NEXUS.",
};

export default async function OperatorDashboardPage() {
  const res = await serverFetch<{ data: OperatorDelivery[]; total: number }>("/operator/deliveries");
  const deliveries = res.data ?? [];

  // Sort ascending by pickup time (most urgent first)
  const sorted = [...deliveries].sort(
    (a, b) => new Date(a.pickupDate).getTime() - new Date(b.pickupDate).getTime()
  );

  const pendingDocsCount = sorted.filter((d) =>
    d.documents.some((doc) => doc.status === "PENDING_REVIEW")
  ).length;

  const totalBalance = sorted.reduce((sum, d) => sum + (d.balanceDueEUR ?? 0), 0);

  const today = format(new Date(), "EEE d MMM", { locale: es });

  return (
    <div className="max-w-lg mx-auto">
      {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold text-slate-900">Panel de Entregas</h1>
          <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 text-xs font-bold px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            CMN
          </span>
        </div>
        <p className="text-sm text-slate-500 capitalize">{today}</p>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <StatCard label="Entregas hoy" value={String(sorted.length)} />
          <StatCard
            label="Docs pendientes"
            value={String(pendingDocsCount)}
            accent={pendingDocsCount > 0}
          />
        </div>

        <div className="mt-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Balance a cobrar hoy
          </p>
          <p className="text-3xl font-black text-slate-900 mt-1 tabular-nums">
            {totalBalance.toLocaleString("es-ES")} â‚¬
          </p>
        </div>
      </div>

      {/* â”€â”€ Delivery list â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <DeliveryListClient deliveries={sorted} />
    </div>
  );
}

// â”€â”€ Static helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function StatCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
      <p
        className={`text-2xl font-black mt-1 tabular-nums ${
          accent ? "text-amber-500" : "text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

