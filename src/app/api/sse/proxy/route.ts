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
export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("nexus_token")?.value;
  if (!token) return new Response("Unauthorized", { status: 401 });

  const reservationId = req.nextUrl.searchParams.get("reservationId");
  if (!reservationId)
    return new Response("reservationId query param required", { status: 400 });

  const API_URL = process.env.API_URL ?? "http://localhost:3900/api/v1";

  // Open upstream connection to /sse/reservation/:id — token is ONLY in the Authorization header
  const upstreamRes = await fetch(
    `${API_URL}/sse/reservation/${reservationId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "text/event-stream",
        "Cache-Control": "no-cache",
      },
      // @ts-expect-error — Node 18+ fetch supports duplex streaming
      duplex: "half",
    },
  );

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
