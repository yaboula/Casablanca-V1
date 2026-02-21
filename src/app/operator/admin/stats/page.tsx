import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { serverFetch } from "@/lib/server-api";
import StatsClient from "./StatsClient";

export const metadata: Metadata = { title: "Estadísticas · NEXUS Admin" };

export interface AdminStats {
  kpi: {
    totalRevenueEurCents: number;
    totalBookings: number;
    activeUsers: number;
    activeVehicles: number;
  };
  bookingsByStatus: Array<{ status: string; count: number }>;
  weeklyTrend: Array<{ week: string; bookings: number; revenueEurCents: number }>;
  topVehicles: Array<{
    id: string;
    brand: string;
    model: string;
    category: string;
    bookings: number;
  }>;
}

export default async function AdminStatsPage() {
  // Role guard server-side
  const cookieStore = await cookies();
  const rawUser = cookieStore.get("nexus_user")?.value;
  let role = "";
  try {
    role = rawUser ? JSON.parse(decodeURIComponent(rawUser)).role : "";
  } catch {}
  if (role !== "ADMIN") redirect("/operator/dashboard");

  const stats = await serverFetch<AdminStats>("/admin/stats");

  return <StatsClient stats={stats} />;
}
