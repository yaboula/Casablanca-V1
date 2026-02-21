/**
 * Generic admin API proxy — forwards requests to NestJS with the HttpOnly token.
 * Matches: /api/admin/[...path]
 */
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API = process.env.API_URL ?? "http://localhost:3900/api/v1";

async function handler(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  const cookieStore = await cookies();
  const token = cookieStore.get("nexus_token")?.value;

  // Verify ADMIN role in nexus_user public cookie
  const rawUser = cookieStore.get("nexus_user")?.value;
  let role = "";
  try {
    role = rawUser ? JSON.parse(decodeURIComponent(rawUser)).role : "";
  } catch {}

  if (!token || role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const params = await context.params;
  const nestPath = params.path.join("/");
  const searchString = req.nextUrl.search;
  const upstreamUrl = `${API}/admin/${nestPath}${searchString}`;

  const isFormData = req.headers.get("content-type")?.includes("multipart");
  const bodyInit: BodyInit | null = ["GET", "HEAD"].includes(req.method)
    ? null
    : isFormData
    ? await req.blob()
    : await req.text();

  const upstreamRes = await fetch(upstreamUrl, {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    ...(bodyInit !== null ? { body: bodyInit } : {}),
    cache: "no-store",
  });

  if (upstreamRes.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const data = await upstreamRes.json();
  return NextResponse.json(data, { status: upstreamRes.status });
}

export const GET    = handler;
export const POST   = handler;
export const PATCH  = handler;
export const DELETE = handler;
