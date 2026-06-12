import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/auth/route-guards";
import { getDashboardData } from "@/features/dashboard/dashboard-service";
import { DashboardView } from "@/features/dashboard/DashboardView";
import { getDefaultRouteForRole } from "@/features/auth/auth-redirects";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard — Nexus Mobility",
  description: "View and manage your car rental reservations at Casablanca Mohammed V Airport.",
};

export default async function DashboardPage() {
  const user = await requireAuthenticatedUser("/dashboard");

  if (user.role !== "USER") {
    redirect(getDefaultRouteForRole(user.role));
  }

  let data;
  try {
    data = await getDashboardData();
  } catch {
    // On error, render an empty/recoverable dashboard rather than crashing
    data = { reservations: [], total: 0 };
  }

  return (
    <DashboardView
      userName={user.fullName || user.email || ""}
      data={data}
    />
  );
}
