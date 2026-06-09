export type ApiErrorKind =
  | "auth"
  | "validation"
  | "forbidden"
  | "not-found"
  | "conflict"
  | "server"
  | "network"
  | "unknown";

export type ApiErrorPayload = {
  ok: false;
  status: number;
  kind: ApiErrorKind;
  message: string;
  errors?: string[];
  path?: string;
  timestamp?: string;
};

export type BackendErrorPayload = {
  statusCode?: number;
  message?: string | string[];
  errors?: string[];
  path?: string;
  timestamp?: string;
  error?: string;
};

export class ApiError extends Error {
  readonly payload: ApiErrorPayload;

  constructor(payload: ApiErrorPayload) {
    super(payload.message);
    this.name = "ApiError";
    this.payload = payload;
  }
}

export function getApiErrorKind(status: number): ApiErrorKind {
  if (status === 400 || status === 422) return "validation";
  if (status === 401) return "auth";
  if (status === 403) return "forbidden";
  if (status === 404) return "not-found";
  if (status === 409) return "conflict";
  if (status >= 500) return "server";
  return "unknown";
}

export function normalizeApiError(
  input: unknown,
  fallbackStatus = 500,
): ApiErrorPayload {
  if (input instanceof ApiError) {
    return input.payload;
  }

  if (input instanceof Error) {
    return {
      ok: false,
      status: fallbackStatus,
      kind: fallbackStatus === 503 ? "network" : getApiErrorKind(fallbackStatus),
      message: input.message || "Request failed",
    };
  }

  const backendError = isRecord(input) ? (input as BackendErrorPayload) : {};
  const status = backendError.statusCode ?? fallbackStatus;
  const rawMessage = backendError.message ?? backendError.error;
  const errors = Array.isArray(backendError.errors)
    ? backendError.errors
    : Array.isArray(rawMessage)
      ? rawMessage
      : undefined;

  return {
    ok: false,
    status,
    kind: getApiErrorKind(status),
    message: Array.isArray(rawMessage)
      ? "Validation failed"
      : rawMessage || defaultMessageForStatus(status),
    ...(errors ? { errors } : {}),
    ...(backendError.path ? { path: backendError.path } : {}),
    ...(backendError.timestamp ? { timestamp: backendError.timestamp } : {}),
  };
}

export function toUiSafeError(input: unknown, fallbackStatus = 500) {
  return normalizeApiError(input, fallbackStatus);
}

export function throwApiError(input: unknown, fallbackStatus = 500): never {
  throw new ApiError(normalizeApiError(input, fallbackStatus));
}

function defaultMessageForStatus(status: number): string {
  if (status === 401) return "Authentication required";
  if (status === 403) return "You do not have permission for this action";
  if (status === 404) return "Resource not found";
  if (status === 409) return "Request conflicts with current state";
  if (status >= 500) return "Server error";
  return "Request failed";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
