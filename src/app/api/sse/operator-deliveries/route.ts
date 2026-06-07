import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * SSE proxy for operator delivery updates.
 * Injects the Authorization header so the JWT is never exposed in URLs.
 *
 * Browser → GET /api/sse/operator-deliveries
 *               ↓ (reads nexus_token cookie → adds Authorization header)
 * NestJS  → GET /api/v1/sse/operator/deliveries
 *               ↓ text/event-stream
 * Browser (EventSource)
 *
 * Events emitted:
 *   DELIVERY_UPDATE — when a reservation transitions (check-in, scan-qr)
 *   ping            — keepalive every 15s
 */
export async function GET(_req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("nexus_token")?.value;
  if (!token) return new Response("Unauthorized", { status: 401 });

  const API_URL = process.env.API_URL ?? "http://localhost:3900/api/v1";

  const upstreamRes = await fetch(`${API_URL}/sse/operator/deliveries`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "text/event-stream",
      "Cache-Control": "no-cache",
    },
    // @ts-expect-error — Node 18+ fetch supports duplex streaming
    duplex: "half",
  });

  if (!upstreamRes.ok || !upstreamRes.body) {
    return new Response("SSE upstream error", { status: 502 });
  }

  return new Response(upstreamRes.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
