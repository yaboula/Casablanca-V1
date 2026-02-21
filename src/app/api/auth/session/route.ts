import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const IS_PROD = process.env.NODE_ENV === "production";

/**
 * POST /api/auth/session
 * Receives { accessToken, user } from the client after a successful
 * login/register call to NestJS, then writes two cookies:
 *  - nexus_token : HttpOnly, Secure — the raw JWT (never readable by JS)
 *  - nexus_user  : JSON with public fields (readable by JS for UI)
 */
export async function POST(req: NextRequest) {
  let body: { accessToken: string; refreshToken?: string; user: Record<string, unknown> };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { accessToken, refreshToken, user } = body;

  if (!accessToken || !user) {
    return NextResponse.json(
      { error: "accessToken and user are required" },
      { status: 400 }
    );
  }

  // Decode exp claim from JWT to set cookie max-age accordingly
  let maxAge = 60 * 60 * 24; // default 24 h
  try {
    const payload = JSON.parse(
      Buffer.from(accessToken.split(".")[1], "base64url").toString()
    );
    if (payload.exp) {
      maxAge = Math.max(0, payload.exp - Math.floor(Date.now() / 1000));
    }
  } catch {
    // use default
  }

  const cookieOptions = {
    httpOnly: false as boolean,
    secure: IS_PROD,
    sameSite: "strict" as const,
    path: "/",
    maxAge,
  };

  const res = NextResponse.json({ ok: true });

  // HttpOnly — the JWT itself: invisible to JS
  res.cookies.set("nexus_token", accessToken, {
    ...cookieOptions,
    httpOnly: true,
  });

  // HttpOnly — refresh token: invisible to JS
  if (refreshToken) {
    let refreshMaxAge = 60 * 60 * 24 * 30; // default 30 days
    try {
      const rPayload = JSON.parse(
        Buffer.from(refreshToken.split(".")[1], "base64url").toString()
      );
      if (rPayload.exp) {
        refreshMaxAge = Math.max(0, rPayload.exp - Math.floor(Date.now() / 1000));
      }
    } catch {
      // use default
    }
    res.cookies.set("nexus_refresh", refreshToken, {
      ...cookieOptions,
      httpOnly: true,
      maxAge: refreshMaxAge,
    });
  }

  // Public — user info for UI (not HttpOnly)
  const publicUser = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  };
  res.cookies.set("nexus_user", JSON.stringify(publicUser), {
    ...cookieOptions,
    httpOnly: false,
  });

  return res;
}

/**
 * DELETE /api/auth/session
 * Clears both session cookies → logout.
 */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });

  res.cookies.set("nexus_token", "", {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  res.cookies.set("nexus_refresh", "", {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  res.cookies.set("nexus_user", "", {
    httpOnly: false,
    secure: IS_PROD,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  return res;
}
