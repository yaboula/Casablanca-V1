import { cookies } from "next/headers";
import { buildBackendUrl } from "./backend-config";
import { throwApiError } from "./errors";
import { parseApiResponse } from "./response";
import { AUTH_COOKIES } from "@/lib/auth/cookies";

type ServerFetchInit = Omit<RequestInit, "body"> & {
  body?: BodyInit | Record<string, unknown> | null;
};

export async function serverFetch<T>(
  path: string,
  init: ServerFetchInit = {},
): Promise<T> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_COOKIES.accessToken)?.value;
  const headers = new Headers(init.headers);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  let body = init.body as BodyInit | undefined;
  if (init.body && isPlainObject(init.body)) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(init.body);
  }

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  let response: Response;
  try {
    response = await fetch(buildBackendUrl(path), {
      ...init,
      headers,
      body,
      cache: init.cache ?? "no-store",
    });
  } catch (error) {
    throwApiError(error, 503);
  }

  return parseApiResponse<T>(response);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}
