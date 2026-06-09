import { cookies } from "next/headers";
import { AUTH_COOKIES } from "./cookies";
import type { CurrentUser, Session } from "./types";
import { serverFetch } from "@/lib/api/server-fetch";

export async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIES.accessToken)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIES.refreshToken)?.value;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSession();
  return session?.user ?? null;
}

export async function getSession(): Promise<Session | null> {
  try {
    const data = await serverFetch<{ user: CurrentUser }>("/auth/me", {
      cache: "no-store",
    });
    return { user: data.user };
  } catch {
    return null;
  }
}
