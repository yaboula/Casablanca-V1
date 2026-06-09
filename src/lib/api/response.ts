import { normalizeApiError, throwApiError } from "./errors";

export async function parseApiResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => "");

  if (!response.ok) {
    throwApiError(payload, response.status);
  }

  return payload as T;
}

export async function readUiSafeResponse(response: Response) {
  try {
    return await parseApiResponse(response);
  } catch (error) {
    return normalizeApiError(error, response.status);
  }
}
