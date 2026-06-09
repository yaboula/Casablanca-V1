import { buildClientApiUrl } from "./backend-config";
import { parseApiResponse } from "./response";

type ClientFetchInit = Omit<RequestInit, "body"> & {
  body?: BodyInit | Record<string, unknown> | null;
};

export async function clientFetch<T>(
  path: string,
  init: ClientFetchInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  let body = init.body as BodyInit | undefined;
  if (init.body && isPlainObject(init.body)) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(init.body);
  }

  const response = await fetch(buildClientApiUrl(path), {
    ...init,
    headers,
    body,
    credentials: "same-origin",
  });

  return parseApiResponse<T>(response);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}
