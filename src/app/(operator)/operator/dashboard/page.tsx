import type { Metadata } from "next";
import { requireRouteRole } from "@/lib/auth/route-guards";
import { getDeliveries, getDeliveryStats } from "@/features/operator/operator-service";
import { OperatorDashboardView } from "@/features/operator/OperatorDashboardView";
import type { DeliveryViewModel, DeliveryStats } from "@/features/operator/types";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Delivery Dashboard — Nexus Mobility Operator",
  description: "Operator delivery dashboard for Casablanca Mohammed V Airport.",
};

function ForbiddenShell() {
  return (
    <section className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col justify-center px-6 py-16">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-neutral-500">
        Forbidden
      </p>
      <h1 className="mt-4 text-4xl font-black text-neutral-950">
        Operator access required
      </h1>
      <p className="mt-4 text-base leading-7 text-neutral-700">
        You are signed in, but your role does not grant access to the operator
        console.
      </p>
      <Link
        href="/dashboard"
        className="mt-8 inline-flex min-h-11 w-fit items-center rounded-md border border-[var(--nx-line)] bg-white px-5 font-bold text-neutral-950 transition hover:bg-neutral-50"
      >
        Go to customer dashboard
      </Link>
    </section>
  );
}

export default async function OperatorDashboardPage() {
  const result = await requireRouteRole(
    ["OPERATOR", "ADMIN"],
    "/operator/dashboard",
  );

  if (result.forbidden) {
    return <ForbiddenShell />;
  }

  const { user } = result;

  let deliveries: DeliveryViewModel[];
  let stats: DeliveryStats;

  try {
    [deliveries, stats] = await Promise.all([
      getDeliveries(),
      getDeliveryStats(),
    ]);
  } catch {
    deliveries = [];
    stats = {
      date: new Date().toISOString().split("T")[0],
      total: 0,
      confirmed: 0,
      inProgress: 0,
      completed: 0,
    };
  }

  return (
    <OperatorDashboardView
      operatorName={user.fullName || user.email || ""}
      deliveries={deliveries}
      stats={stats}
    />
  );
}
