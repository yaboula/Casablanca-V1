import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/auth/route-guards";
import { getDashboardData } from "@/features/dashboard/dashboard-service";
import { TripsHistoryView } from "@/features/dashboard/TripsHistoryView";
import { getDefaultRouteForRole } from "@/features/auth/auth-redirects";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Trip History — Nexus Mobility",
  description: "View your past and cancelled reservations with Nexus Mobility.",
};

export default async function HistoryPage() {
  const user = await requireAuthenticatedUser("/history");

  if (user.role !== "USER") {
    redirect(getDefaultRouteForRole(user.role));
  }

  let data;
  try {
    data = await getDashboardData();
  } catch {
    data = { reservations: [], total: 0 };
  }

  return (
    <TripsHistoryView
      userName={user.fullName || user.email || ""}
      data={data}
    />
  );
}
