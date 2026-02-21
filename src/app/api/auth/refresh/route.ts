import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3900/api/v1";

const IS_PROD = process.env.NODE_ENV === "production";

/**
 * POST /api/auth/refresh
 * Reads the `nexus_refresh` HttpOnly cookie (invisible to browser JS),
 * forwards it to NestJS `/auth/refresh`, and — on success — rotates both
 * `nexus_token` and `nexus_refresh` cookies.
 *
 * Called by `apiFetch` automatically when a 401 is received, so the user
 * never gets redirected to /login as long as their refresh token is valid.
 */
export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("nexus_refresh")?.value;

  if (!refreshToken) {
    return NextResponse.json({ ok: false, reason: "no_refresh_token" }, { status: 401 });
  }

  // Forward to NestJS
  let nestRes: Response;
  try {
    nestRes = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    return NextResponse.json({ ok: false, reason: "upstream_error" }, { status: 503 });
  }

  if (!nestRes.ok) {
    // Refresh token expired or invalid — clear all session cookies
    const res = NextResponse.json({ ok: false, reason: "refresh_expired" }, { status: 401 });
    for (const name of ["nexus_token", "nexus_refresh", "nexus_user"]) {
      res.cookies.set(name, "", {
        httpOnly: name !== "nexus_user",
        secure: IS_PROD,
        sameSite: "strict",
        path: "/",
        maxAge: 0,
      });
    }
    return res;
  }

  const data = await nestRes.json() as {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
    user: { id: string; email: string; fullName: string; role: string };
  };

  const { accessToken, refreshToken: newRefreshToken, user } = data;

  // Compute max-age from JWT exp
  function maxAgeFromToken(token: string, fallback: number): number {
    try {
      const p = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
      if (p.exp) return Math.max(0, p.exp - Math.floor(Date.now() / 1000));
    } catch { /* ignore */ }
    return fallback;
  }

  const cookieBase = { secure: IS_PROD, sameSite: "strict" as const, path: "/" };
  const res = NextResponse.json({ ok: true });

  res.cookies.set("nexus_token", accessToken, {
    ...cookieBase,
    httpOnly: true,
    maxAge: maxAgeFromToken(accessToken, 60 * 60 * 24),
  });
  res.cookies.set("nexus_refresh", newRefreshToken, {
    ...cookieBase,
    httpOnly: true,
    maxAge: maxAgeFromToken(newRefreshToken, 60 * 60 * 24 * 30),
  });
  res.cookies.set("nexus_user", JSON.stringify({ id: user.id, email: user.email, fullName: user.fullName, role: user.role }), {
    ...cookieBase,
    httpOnly: false,
    maxAge: maxAgeFromToken(accessToken, 60 * 60 * 24),
  });

  return res;
}
