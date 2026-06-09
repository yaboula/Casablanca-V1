import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { buildBackendUrl } from "@/lib/api/backend-config";
import { AUTH_COOKIES } from "@/lib/auth/cookies";
import { clearAuthCookies } from "@/lib/auth/session-cookies";

export async function POST() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_COOKIES.accessToken)?.value;

  if (accessToken) {
    await fetch(buildBackendUrl("/auth/logout"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }).catch(() => null);
  }

  const res = NextResponse.json({ ok: true });
  clearAuthCookies(res);
  return res;
}
