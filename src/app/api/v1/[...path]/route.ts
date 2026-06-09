import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { buildBackendUrl } from "@/lib/api/backend-config";
import { normalizeApiError } from "@/lib/api/errors";
import { AUTH_COOKIES } from "@/lib/auth/cookies";
import { clearAuthCookies, setAuthCookies } from "@/lib/auth/session-cookies";
import type { AuthTokenResponse } from "@/lib/auth/types";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

const SUPPORTED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"];

async function handler(req: NextRequest, context: RouteContext) {
  if (!SUPPORTED_METHODS.includes(req.method)) {
    return NextResponse.json(
      normalizeApiError({ statusCode: 405, message: "Method not allowed" }, 405),
      { status: 405 },
    );
  }

  const params = await context.params;
  const upstreamPath = params.path.join("/");
  const search = req.nextUrl.search;
  const body = await readRequestBody(req);

  const firstResponse = await forwardToBackend(req, upstreamPath, search, body);

  if (firstResponse.status !== 401) {
    return proxyResponse(firstResponse);
  }

  const refreshResult = await refreshFromCookie();
  if (!refreshResult.ok) {
    const res = NextResponse.json(refreshResult.error, {
      status: refreshResult.error.status,
    });
    clearAuthCookies(res);
    return res;
  }

  const retryResponse = await forwardToBackend(
    req,
    upstreamPath,
    search,
    body,
    refreshResult.auth.accessToken,
  );
  const res = await proxyResponse(retryResponse);
  setAuthCookies(res, refreshResult.auth);
  return res;
}

async function forwardToBackend(
  req: NextRequest,
  upstreamPath: string,
  search: string,
  body: BodyInit | null,
  overrideAccessToken?: string,
) {
  const cookieStore = await cookies();
  const accessToken =
    overrideAccessToken ?? cookieStore.get(AUTH_COOKIES.accessToken)?.value;
  const headers = buildForwardHeaders(req, accessToken);

  return fetch(buildBackendUrl(`/${upstreamPath}`, search), {
    method: req.method,
    headers,
    ...(body !== null ? { body } : {}),
    cache: "no-store",
  });
}

async function refreshFromCookie(): Promise<
  | { ok: true; auth: AuthTokenResponse }
  | { ok: false; error: ReturnType<typeof normalizeApiError> }
> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(AUTH_COOKIES.refreshToken)?.value;

  if (!refreshToken) {
    return {
      ok: false,
      error: normalizeApiError(
        { statusCode: 401, message: "Authentication required" },
        401,
      ),
    };
  }

  const response = await fetch(buildBackendUrl("/auth/refresh"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  }).catch((error: Error) => error);

  if (response instanceof Error) {
    return { ok: false, error: normalizeApiError(response, 503) };
  }

  const payload = await readResponsePayload(response);
  if (!response.ok) {
    return { ok: false, error: normalizeApiError(payload, response.status) };
  }

  return { ok: true, auth: payload as AuthTokenResponse };
}

function buildForwardHeaders(req: NextRequest, accessToken?: string) {
  const headers = new Headers();
  const contentType = req.headers.get("content-type");
  const accept = req.headers.get("accept");
  const idempotencyKey = req.headers.get("idempotency-key");

  if (contentType) headers.set("Content-Type", contentType);
  if (accept) headers.set("Accept", accept);
  if (idempotencyKey) headers.set("Idempotency-Key", idempotencyKey);
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  return headers;
}

async function readRequestBody(req: NextRequest): Promise<BodyInit | null> {
  if (req.method === "GET" || req.method === "HEAD") {
    return null;
  }

  return req.arrayBuffer();
}

async function proxyResponse(response: Response): Promise<NextResponse> {
  if (response.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const payload = await response.text();
  return new NextResponse(payload, {
    status: response.status,
    headers: {
      "Content-Type":
        response.headers.get("content-type") ?? "application/json",
    },
  });
}

async function readResponsePayload(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  return contentType.includes("application/json")
    ? response.json().catch(() => null)
    : response.text().catch(() => "");
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const HEAD = handler;
