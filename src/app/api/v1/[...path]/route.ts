/**
 * Generic authenticated proxy: /api/v1/[...path]  →  NestJS /api/v1/[...path]
 *
 * Next.js API routes take precedence over rewrites, so this intercepts ALL
 * calls made through apiFetch (client components) and injects the HttpOnly
 * nexus_token cookie as an Authorization header — since browser JS cannot
 * read HttpOnly cookies directly.
 *
 * Unauthenticated requests (no cookie) are forwarded as-is, letting NestJS
 * decide whether auth is required.
 */
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { SERVER_API_BASE } from "@/lib/config";

const NEST = SERVER_API_BASE;

async function handler(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const cookieStore = await cookies();
  const token = cookieStore.get("nexus_token")?.value;

  const params = await context.params;
  const nestPath = params.path.join("/");
  const search = req.nextUrl.search;
  const upstreamUrl = `${NEST}/${nestPath}${search}`;

  // Forward all headers the client sent, except host
  const forwardHeaders: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    if (key !== "host" && key !== "content-length") {
      forwardHeaders[key] = value;
    }
  });

  // Inject token if session exists
  if (token) {
    forwardHeaders["Authorization"] = `Bearer ${token}`;
  }

  // Read body for non-GET/HEAD methods
  let body: BodyInit | null = null;
  if (!["GET", "HEAD"].includes(req.method)) {
    const contentType = req.headers.get("content-type") ?? "";
    body = contentType.includes("multipart")
      ? await req.blob()
      : await req.text();
  }

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(upstreamUrl, {
      method: req.method,
      headers: forwardHeaders,
      ...(body !== null ? { body } : {}),
      cache: "no-store",
    });
  } catch (err) {
    console.error("[api/v1 proxy] upstream error:", err);
    return NextResponse.json(
      { statusCode: 503, message: "Backend unavailable" },
      { status: 503 },
    );
  }

  if (upstreamRes.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  // Stream back the response preserving status
  const data = await upstreamRes.text();
  return new NextResponse(data, {
    status: upstreamRes.status,
    headers: {
      "Content-Type":
        upstreamRes.headers.get("content-type") ?? "application/json",
    },
  });
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;
