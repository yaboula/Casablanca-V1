/**
 * Server-side authenticated fetch helper for operator Server Components.
 * Must only be called from Server Components or Server Actions (not from client code).
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SERVER_API_BASE } from "@/lib/config";

const BASE = SERVER_API_BASE;

export async function serverFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get("nexus_token")?.value;

  if (!token) {
    redirect("/login?redirect=/operator");
  }

  const url = `${BASE}${path.startsWith("/") ? path : `/${path}`}`;

  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (res.status === 401 || res.status === 403) {
    redirect("/login?redirect=/operator");
  }

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}
