/**
 * NEXUS — Centralized endpoint configuration
 *
 * Single source of truth for all API base URLs.
 *
 * Architecture:
 *   Browser/Mobile  →  Next.js :3600  →  NestJS :3900
 *
 * - CLIENT_API_BASE  : used by browser code (apiFetch, client components).
 *                      Always a relative path → goes through Next.js proxy at /api/v1.
 *                      Works from any device on the network without knowing the server IP.
 *
 * - SERVER_API_BASE  : used by server-side code (Server Components, API Routes).
 *                      Direct internal call to NestJS, never exposed to the browser.
 */

/** For client components — relative, works on any IP/port */
export const CLIENT_API_BASE: string =
  process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";

/** For server-side code — direct to NestJS (internal network) */
export const SERVER_API_BASE: string =
  process.env.API_URL ?? "http://localhost:3900/api/v1";
