import { NextRequest, NextResponse } from "next/server";

// Routes that require authentication
// NOTE: Operator routes are intentionally open in MVP — no real auth yet.
const PROTECTED_CUSTOMER = /^\/(customer)(\/.*)?$/;

// TODO: Replace with real JWT validation when backend is ready
function getSessionRole(req: NextRequest): "USER" | "OPERATOR" | null {
  const mockSession = req.cookies.get("nexus_session");
  if (!mockSession) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(mockSession.value));
    return parsed.role ?? null;
  } catch {
    return null;
  }
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const role = getSessionRole(req);

  // Protect customer routes
  if (PROTECTED_CUSTOMER.test(pathname)) {
    if (!role) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/(customer)/:path*",
  ],
};
