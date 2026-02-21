import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * SSE proxy — injects Authorization header so the JWT never appears in the URL.
 *
 * Browser  →  GET /api/sse/proxy  (cookie nexus_token sent automatically)
 *                  ↓
 * Next.js Route Handler  (reads cookie, builds Authorization header)
 *                  ↓  Authorization: Bearer <token>
 * NestJS  GET /api/v1/sse/user/:userId
 *                  ↓  text/event-stream pipe
 * Browser  (standard EventSource, no token in URL)
 */
export async function GET(_req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("nexus_token")?.value;
  if (!token) return new Response("Unauthorized", { status: 401 });

  // Decode JWT payload to get userId — no signature verification needed (only for routing)
  let userId: string;
  try {
    const payloadB64 = token.split(".")[1];
    const payload = JSON.parse(atob(payloadB64));
    userId = payload.sub as string;
    if (!userId) throw new Error("No sub in JWT");
  } catch {
    return new Response("Invalid token", { status: 400 });
  }

  const API_URL = process.env.API_URL ?? "http://localhost:3001/api/v1";

  // Open upstream connection — token is ONLY in the Authorization header, never in the URL
  const upstreamRes = await fetch(`${API_URL}/sse/user/${userId}`, {
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

  // Pipe ReadableStream from NestJS directly to the browser
  return new Response(upstreamRes.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // disable Nginx/proxy buffering
    },
  });
}
