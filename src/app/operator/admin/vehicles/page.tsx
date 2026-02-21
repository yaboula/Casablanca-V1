import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { serverFetch } from "@/lib/server-api";
import VehiclesAdminClient from "./VehiclesAdminClient";

export const metadata: Metadata = { title: "Flota · NEXUS Admin" };

export interface AdminVehicle {
  id: string;
  brand: string;
  model: string;
  category: "SEDAN" | "SUV" | "LUXURY" | "COMPACT";
  pricePerDayEurCents: number;
  imageUrl: string;
  transmission: "AUTOMATIC" | "MANUAL";
  seats: number;
  luggageCount: number;
  features: string[];
  status: "AVAILABLE" | "RENTED" | "MAINTENANCE" | "INACTIVE";
  createdAt: string;
}

export default async function AdminVehiclesPage() {
  const cookieStore = await cookies();
  const rawUser = cookieStore.get("nexus_user")?.value;
  let role = "";
  try {
    role = rawUser ? JSON.parse(decodeURIComponent(rawUser)).role : "";
  } catch {}
  if (role !== "ADMIN") redirect("/operator/dashboard");

  const result = await serverFetch<{ data: AdminVehicle[]; total: number }>("/admin/vehicles");

  return <VehiclesAdminClient vehicles={result.data} />;
}
