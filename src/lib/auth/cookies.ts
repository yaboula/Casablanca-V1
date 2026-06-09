import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

export const AUTH_COOKIES = {
  accessToken: "casablanca_access_token",
  refreshToken: "casablanca_refresh_token",
} as const;

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const ACCESS_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const REFRESH_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function accessTokenCookieOptions(maxAge = ACCESS_TOKEN_MAX_AGE_SECONDS) {
  return buildCookieOptions(maxAge);
}

export function refreshTokenCookieOptions(maxAge = REFRESH_TOKEN_MAX_AGE_SECONDS) {
  return buildCookieOptions(maxAge);
}

export function expiredCookieOptions() {
  return buildCookieOptions(0);
}

function buildCookieOptions(maxAge: number): Partial<ResponseCookie> {
  return {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "lax",
    path: "/",
    maxAge,
  };
}
