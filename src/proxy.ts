import { NextRequest, NextResponse } from "next/server";

// ── Auth helpers ───────────────────────────────────────────────────

type SessionRole = "USER" | "OPERATOR" | "ADMIN" | null;

/**
 * Reads the `nexus_token` HttpOnly cookie, decodes the JWT payload
 * **without verifying the signature** (safe here — this is routing
 * logic only, not authorization).  Actual authorization is enforced
 * in NestJS via the Bearer token on every API call.
 */
function getSessionRole(req: NextRequest): SessionRole {
  const token = req.cookies.get("nexus_token")?.value;
  if (!token) return null;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // base64url → JSON
    const payloadJson = Buffer.from(parts[1], "base64url").toString("utf-8");
    const payload = JSON.parse(payloadJson);

    // Reject expired tokens
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;

    return (payload.role as SessionRole) ?? null;
  } catch {
    return null;
  }
}

// ── Middleware ───────────────────────────────────────────────────

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const role = getSessionRole(req);

  // ── Customer routes — require any authenticated user ──────
  const isCustomerRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/check-in") ||
    pathname.startsWith("/waiting-room") ||
    pathname.startsWith("/smart-ticket") ||
    pathname.startsWith("/booking/confirmed");

  if (isCustomerRoute && !role) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Operator routes — require OPERATOR or ADMIN role ────
  const isOperatorRoute = pathname.startsWith("/operator");

  if (isOperatorRoute && role !== "OPERATOR" && role !== "ADMIN") {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/check-in/:path*",
    "/waiting-room/:path*",
    "/smart-ticket/:path*",
    "/booking/confirmed/:path*",
    "/operator/:path*",
  ],
};
