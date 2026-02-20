import { NextRequest, NextResponse } from "next/server";

// ── Auth helpers ───────────────────────────────────────────────────

type SessionRole = "USER" | "OPERATOR" | "ADMIN" | null;

function getSessionRole(req: NextRequest): SessionRole {
  const mockSession = req.cookies.get("nexus_session");
  if (!mockSession) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(mockSession.value));
    return parsed.role ?? null;
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
