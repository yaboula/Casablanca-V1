import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { buildBackendUrl } from "@/lib/api/backend-config";
import { normalizeApiError } from "@/lib/api/errors";
import { AUTH_COOKIES } from "@/lib/auth/cookies";
import { clearAuthCookies, setAuthCookies } from "@/lib/auth/session-cookies";
import type { AuthTokenResponse } from "@/lib/auth/types";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(AUTH_COOKIES.refreshToken)?.value;

  if (!refreshToken) {
    const res = NextResponse.json(
      normalizeApiError({ statusCode: 401, message: "Refresh token missing" }, 401),
      { status: 401 },
    );
    clearAuthCookies(res);
    return res;
  }

  const refreshResponse = await fetch(buildBackendUrl("/auth/refresh"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  }).catch((error: Error) => error);

  if (refreshResponse instanceof Error) {
    return NextResponse.json(normalizeApiError(refreshResponse, 503), {
      status: 503,
    });
  }

  const payload = await readPayload(refreshResponse);
  if (!refreshResponse.ok) {
    const res = NextResponse.json(
      normalizeApiError(payload, refreshResponse.status),
      { status: refreshResponse.status },
    );
    clearAuthCookies(res);
    return res;
  }

  const auth = payload as AuthTokenResponse;
  const res = NextResponse.json({ user: auth.user });
  setAuthCookies(res, auth);
  return res;
}

async function readPayload(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  return contentType.includes("application/json")
    ? response.json().catch(() => null)
    : response.text().catch(() => "");
}
