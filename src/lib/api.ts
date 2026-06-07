/**
 * Centralized HTTP client for NEXUS API
 * Prefixes all paths with NEXT_PUBLIC_API_URL and attaches JWT automatically.
 */
import { CLIENT_API_BASE } from "@/lib/config";

const BASE = CLIENT_API_BASE;

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}

export class NexusApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly error?: string,
  ) {
    super(message);
    this.name = "NexusApiError";
  }
}

/**
 * Reads the JWT stored in the `nexus_token` cookie (browser) or falls back
 * to the Authorization header pattern for SSR usage.
 */
function getJwtFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/nexus_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  // Bug 20 fix: Token injection removed — handled by Next.js proxy.
  // `auth` is still used for 401 retry / redirect logic below.
  const { auth = false, headers: extraHeaders, ...rest } = init;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(extraHeaders as Record<string, string>),
  };

  const url = `${BASE}${path.startsWith("/") ? path : `/${path}`}`;

  const res = await fetch(url, { ...rest, headers });

  if (!res.ok) {
    // 401 on an authenticated call — try silent token refresh first
    if (res.status === 401 && auth && typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      const authPages = ["/login", "/register"];
      if (!authPages.some((p) => currentPath.startsWith(p))) {
        // Attempt one silent refresh via the server-side API route
        try {
          const refreshRes = await fetch("/api/auth/refresh", {
            method: "POST",
          });
          if (refreshRes.ok) {
            // Re-read the NEW token from cookie after refresh
            const newToken = getJwtFromCookie();
            const retryHeaders: Record<string, string> = {
              ...headers,
              ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}),
            };
            // Retry the original request exactly once with fresh token
            const retryRes = await fetch(url, {
              ...rest,
              headers: retryHeaders,
            });
            if (retryRes.ok) {
              if (retryRes.status === 204) return undefined as T;
              return retryRes.json() as Promise<T>;
            }
          }
        } catch {
          // fall through to redirect
        }
        // Refresh failed — clear session and redirect to login
        await fetch("/api/auth/session", { method: "DELETE" }).catch(() => {});
        window.location.href = "/login?session_expired=true";
        // Return a never-resolving promise so callers don't process stale state
        return new Promise(() => {});
      }
    }

    let body: ApiError;
    try {
      body = await res.json();
    } catch {
      body = { statusCode: res.status, message: res.statusText };
    }
    const message = Array.isArray(body.message)
      ? body.message.join(", ")
      : body.message;
    throw new NexusApiError(res.status, message, body.error);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}
