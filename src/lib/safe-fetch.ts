/**
 * F2.2 — Type-safe server fetch wrapper with runtime Zod validation.
 *
 * Wraps serverFetch() with Zod schema parsing so that API shape mismatches
 * are caught at runtime (not just at compile time).
 *
 * Usage:
 *   const result = await safeFetch(
 *     '/operator/documents/pending',
 *     PendingDocumentsResponseSchema,
 *   );
 *
 * On success: returns the parsed, fully-typed value.
 * On schema mismatch: throws a ZodError with detailed field-level messages.
 * On HTTP error: re-throws from serverFetch (preserves redirect behaviour).
 *
 * Must only be called from Server Components or Server Actions.
 */
import { type ZodSchema } from "zod";
import { serverFetch } from "@/lib/server-api";

export async function safeFetch<T>(
  path: string,
  schema: ZodSchema<T>,
  init?: RequestInit,
): Promise<T> {
  // serverFetch handles auth (cookie), base URL, and 401/403 redirects.
  const raw = await serverFetch<unknown>(path, init);
  // schema.parse() throws ZodError with actionable messages if shape is wrong.
  return schema.parse(raw);
}
