import { NextResponse } from "next/server";
import {
  AUTH_COOKIES,
  accessTokenCookieOptions,
  expiredCookieOptions,
  refreshTokenCookieOptions,
} from "./cookies";
import type { AuthTokenResponse } from "./types";

export function setAuthCookies(res: NextResponse, auth: AuthTokenResponse) {
  res.cookies.set(
    AUTH_COOKIES.accessToken,
    auth.accessToken,
    accessTokenCookieOptions(),
  );
  res.cookies.set(
    AUTH_COOKIES.refreshToken,
    auth.refreshToken,
    refreshTokenCookieOptions(),
  );
}

export function clearAuthCookies(res: NextResponse) {
  res.cookies.set(AUTH_COOKIES.accessToken, "", expiredCookieOptions());
  res.cookies.set(AUTH_COOKIES.refreshToken, "", expiredCookieOptions());
}
