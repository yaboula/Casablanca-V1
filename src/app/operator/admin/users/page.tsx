import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { serverFetch } from "@/lib/server-api";
import UsersAdminClient from "./UsersAdminClient";

export const metadata: Metadata = { title: "Usuarios · NEXUS Admin" };

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: "USER" | "OPERATOR" | "ADMIN";
  isActive: boolean;
  phone: string | null;
  createdAt: string;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const cookieStore = await cookies();
  const rawUser = cookieStore.get("nexus_user")?.value;
  let role = "";
  try {
    role = rawUser ? JSON.parse(decodeURIComponent(rawUser)).role : "";
  } catch {}
  if (role !== "ADMIN") redirect("/operator/dashboard");

  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const q = sp.q ?? "";

  const qs = new URLSearchParams({ page: String(page), limit: "25" });
  if (q) qs.set("q", q);

  const data = await serverFetch<{
    data: AdminUser[];
    total: number;
    page: number;
    limit: number;
  }>(`/admin/users?${qs.toString()}`);

  return (
    <UsersAdminClient
      users={data.data}
      total={data.total}
      page={data.page}
      limit={data.limit}
      initialQ={q}
    />
  );
}
