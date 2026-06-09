/**
 * Document adapters — maps raw backend document API responses to view models.
 *
 * Same defensive pattern as reservation-adapters.ts:
 * - All input fields typed as unknown
 * - Each field validated individually
 * - Returns null for records with missing required fields
 * - Plain JSON-safe output — safe to cross server→client boundary
 *
 * Backend source: backend/src/documents/reservation-document.entity.ts
 * fileKey is stripped by the backend; only fileUrl (presigned read URL) is returned.
 */

import type {
  DocumentApi,
  DocumentType,
  DocumentStatus,
  DocumentViewModel,
} from "./types";

// ---------------------------------------------------------------------------
// Allowed enum values
// ---------------------------------------------------------------------------

const DOCUMENT_TYPES = new Set<string>(["PASSPORT", "DRIVING_LICENSE"]);
const DOCUMENT_STATUSES = new Set<string>([
  "PENDING_REVIEW",
  "APPROVED",
  "REJECTED",
]);

// ---------------------------------------------------------------------------
// Primitive helpers
// ---------------------------------------------------------------------------

function asNonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function asEnum<T extends string>(
  value: unknown,
  allowed: Set<string>,
): T | null {
  return typeof value === "string" && allowed.has(value) ? (value as T) : null;
}

function asIsoString(value: unknown): string | null {
  if (typeof value !== "string" && !(value instanceof Date)) return null;
  const date = new Date(value as string | Date);
  if (isNaN(date.getTime())) return null;
  return date.toISOString();
}

// ---------------------------------------------------------------------------
// Single document adapter
// ---------------------------------------------------------------------------

export function adaptDocument(input: DocumentApi): DocumentViewModel | null {
  if (typeof input !== "object" || input === null) return null;

  const id = asNonEmptyString(input.id);
  const reservationId = asNonEmptyString(input.reservationId);
  const type = asEnum<DocumentType>(input.type, DOCUMENT_TYPES);
  const status = asEnum<DocumentStatus>(input.status, DOCUMENT_STATUSES);
  const createdAt = asIsoString(input.createdAt);

  // Required fields — if any are missing the record is not usable
  if (!id || !reservationId || !type || !status || !createdAt) return null;

  return {
    id,
    reservationId,
    type,
    status,
    // fileUrl is a presigned read URL — may be null if S3 key missing
    fileUrl: asNonEmptyString(input.fileUrl),
    // rejectionReason is only set when status === REJECTED
    rejectionReason:
      status === "REJECTED" ? asNonEmptyString(input.rejectionReason) : null,
    createdAt,
  };
}

// ---------------------------------------------------------------------------
// List adapter
// ---------------------------------------------------------------------------

/**
 * Adapts the documents list response from GET /documents/:reservationId.
 * Skips null/invalid records defensively — does not throw on partial data.
 */
export function adaptDocuments(
  raw: unknown,
): DocumentViewModel[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => adaptDocument(item as DocumentApi))
    .filter((doc): doc is DocumentViewModel => doc !== null);
}

// ---------------------------------------------------------------------------
// Presign response adapter
// ---------------------------------------------------------------------------

/**
 * Validates the presign response from POST /documents/presign.
 * Returns { uploadUrl, fileKey } or null if the response is malformed.
 */
export function adaptPresignResponse(
  raw: unknown,
): { uploadUrl: string; fileKey: string } | null {
  if (typeof raw !== "object" || raw === null) return null;

  const r = raw as Record<string, unknown>;
  const uploadUrl = asNonEmptyString(r.uploadUrl);
  const fileKey = asNonEmptyString(r.fileKey);

  if (!uploadUrl || !fileKey) return null;

  return { uploadUrl, fileKey };
}
