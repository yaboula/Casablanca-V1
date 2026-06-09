import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { buildBackendUrl } from "@/lib/api/backend-config";
import { normalizeApiError } from "@/lib/api/errors";
import { AUTH_COOKIES } from "@/lib/auth/cookies";
import { clearAuthCookies, setAuthCookies } from "@/lib/auth/session-cookies";
import type { AuthTokenResponse, CurrentUser } from "@/lib/auth/types";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_COOKIES.accessToken)?.value;

  if (!accessToken) {
    return NextResponse.json(
      normalizeApiError({ statusCode: 401, message: "Authentication required" }, 401),
      { status: 401 },
    );
  }

  const response = await fetch(buildBackendUrl("/auth/me"), {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  }).catch((error: Error) => error);

  if (response instanceof Error) {
    return NextResponse.json(normalizeApiError(response, 503), { status: 503 });
  }

  const payload = await readPayload(response);
  if (!response.ok) {
    return NextResponse.json(normalizeApiError(payload, response.status), {
      status: response.status,
    });
  }

  return NextResponse.json(payload);
}

export async function POST(req: NextRequest) {
  let body: AuthTokenResponse | AuthRequestBody;

  try {
    body = (await req.json()) as AuthTokenResponse | AuthRequestBody;
  } catch {
    return NextResponse.json(
      normalizeApiError({ statusCode: 400, message: "Invalid session body" }, 400),
      { status: 400 },
    );
  }

  if (isCredentialAuthBody(body)) {
    return authenticateWithBackend(body);
  }

  if (!isAuthTokenResponse(body)) {
    return NextResponse.json(
      normalizeApiError(
        {
          statusCode: 400,
          message: "accessToken, refreshToken, and user are required",
        },
        400,
      ),
      { status: 400 },
    );
  }

  const res = NextResponse.json({ user: toPublicUser(body.user) });
  setAuthCookies(res, body);
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  clearAuthCookies(res);
  return res;
}

function toPublicUser(user: CurrentUser): CurrentUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    phone: user.phone ?? null,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

type AuthRequestBody = {
  action: "login" | "register";
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
};

async function authenticateWithBackend(body: AuthRequestBody) {
  const endpoint = body.action === "register" ? "/auth/register" : "/auth/login";
  const response = await fetch(buildBackendUrl(endpoint), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: body.email,
      password: body.password,
      ...(body.fullName ? { fullName: body.fullName } : {}),
      ...(body.phone ? { phone: body.phone } : {}),
    }),
    cache: "no-store",
  }).catch((error: Error) => error);

  if (response instanceof Error) {
    return NextResponse.json(normalizeApiError(response, 503), { status: 503 });
  }

  const payload = await readPayload(response);
  if (!response.ok) {
    return NextResponse.json(normalizeApiError(payload, response.status), {
      status: response.status,
    });
  }

  const auth = payload as AuthTokenResponse;
  const res = NextResponse.json({ user: toPublicUser(auth.user) });
  setAuthCookies(res, auth);
  return res;
}

function isCredentialAuthBody(value: unknown): value is AuthRequestBody {
  if (!isRecord(value)) return false;
  return (
    (value.action === "login" || value.action === "register") &&
    typeof value.email === "string" &&
    typeof value.password === "string"
  );
}

function isAuthTokenResponse(value: unknown): value is AuthTokenResponse {
  if (!isRecord(value)) return false;
  return (
    typeof value.accessToken === "string" &&
    typeof value.refreshToken === "string" &&
    isRecord(value.user)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function readPayload(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  return contentType.includes("application/json")
    ? response.json().catch(() => null)
    : response.text().catch(() => "");
}
