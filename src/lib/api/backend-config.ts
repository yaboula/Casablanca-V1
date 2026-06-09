const API_PREFIX = "/api/v1";
const DEFAULT_SERVER_API_URL = "http://localhost:3900/api/v1";
const DEFAULT_PUBLIC_API_URL = "/api/v1";

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function ensureApiPrefix(value: string): string {
  const trimmed = trimTrailingSlash(value);
  return trimmed.endsWith(API_PREFIX) ? trimmed : `${trimmed}${API_PREFIX}`;
}

export const backendConfig = {
  apiPrefix: API_PREFIX,
  serverApiBaseUrl: ensureApiPrefix(
    process.env.API_URL ??
      process.env.BACKEND_API_URL ??
      process.env.NEXT_PRIVATE_API_URL ??
      DEFAULT_SERVER_API_URL,
  ),
  publicApiBaseUrl:
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ??
    DEFAULT_PUBLIC_API_URL,
};

export function buildBackendUrl(path: string, search = ""): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${backendConfig.serverApiBaseUrl}${normalizedPath}${search}`;
}

export function buildClientApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${backendConfig.publicApiBaseUrl}${normalizedPath}`;
}
