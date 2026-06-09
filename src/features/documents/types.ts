/**
 * Document feature types.
 *
 * All types map exactly to the backend document entity and DTOs.
 * No frontend-invented statuses or fields.
 *
 * Backend entity: backend/src/documents/reservation-document.entity.ts
 * Backend DTOs:   backend/src/documents/dto/presign-document.dto.ts
 *                 backend/src/documents/dto/confirm-document.dto.ts
 */

// ---------------------------------------------------------------------------
// Enums — exact mirrors of backend DocumentType and DocumentStatus
// ---------------------------------------------------------------------------

export type DocumentType = "PASSPORT" | "DRIVING_LICENSE";

export type DocumentStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED";

// ---------------------------------------------------------------------------
// Allowed MIME types — mirrors ALLOWED_DOCUMENT_MIME_TYPES in presign DTO
// ---------------------------------------------------------------------------

export const ALLOWED_DOCUMENT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
] as const;

export type DocumentMimeType = (typeof ALLOWED_DOCUMENT_MIME_TYPES)[number];

export function isAllowedMimeType(value: string): value is DocumentMimeType {
  return (ALLOWED_DOCUMENT_MIME_TYPES as readonly string[]).includes(value);
}

// ---------------------------------------------------------------------------
// Backend API response shapes (raw, before adaptation)
// ---------------------------------------------------------------------------

/**
 * Raw document record from GET /documents/:reservationId
 * (fileKey is stripped; fileUrl is generated presigned read URL)
 */
export type DocumentApi = {
  id?: unknown;
  userId?: unknown;
  reservationId?: unknown;
  type?: unknown;
  status?: unknown;
  rejectionReason?: unknown;
  reviewedBy?: unknown;
  reviewedAt?: unknown;
  createdAt?: unknown;
  /** Presigned S3 read URL — valid for ~5 min. NOT the fileKey. */
  fileUrl?: unknown;
};

/**
 * Raw presign response from POST /documents/presign
 */
export type PresignApi = {
  uploadUrl?: unknown;
  fileKey?: unknown;
};

/**
 * Response from GET /documents/:reservationId
 */
export type DocumentsListApiResponse = {
  data: DocumentApi[];
};

/**
 * Response from POST /documents/confirm
 */
export type DocumentConfirmApiResponse = {
  data: DocumentApi;
};

// ---------------------------------------------------------------------------
// Frontend request DTOs — exact mirrors of backend DTO fields
// ---------------------------------------------------------------------------

/** POST /documents/presign */
export type PresignDocumentRequest = {
  reservationId: string;
  type: DocumentType;
  mimeType?: DocumentMimeType;
};

/** POST /documents/confirm */
export type ConfirmDocumentRequest = {
  fileKey: string;
  reservationId: string;
  type: DocumentType;
};

// ---------------------------------------------------------------------------
// View model — frontend representation after adaptation
// ---------------------------------------------------------------------------

export type DocumentViewModel = {
  /** Backend UUID */
  id: string;
  reservationId: string;
  type: DocumentType;
  status: DocumentStatus;
  /** Presigned read URL from backend — valid ~5 min, do not cache */
  fileUrl: string | null;
  /** Operator rejection reason — only present when status === REJECTED */
  rejectionReason: string | null;
  /** ISO datetime string */
  createdAt: string;
};

// ---------------------------------------------------------------------------
// Upload lifecycle state
// ---------------------------------------------------------------------------

/**
 * Per-document upload UI state.
 * idle → selecting → presigning → uploading → confirming → done | error
 */
export type UploadState =
  | "idle"
  | "selecting"
  | "presigning"
  | "uploading"
  | "confirming"
  | "done"
  | "error";

/** Upload progress — percentage 0-100 during direct S3 PUT */
export type UploadProgress = {
  percent: number;
};

export type UploadError = {
  message: string;
  /** true if user can retry the same file */
  recoverable: boolean;
  /** true if the confirm step failed but the S3 upload succeeded */
  confirmFailed?: boolean;
  /** fileKey to retry confirm — only set when confirmFailed is true */
  pendingFileKey?: string;
  /** type to retry confirm — only set when confirmFailed is true */
  pendingType?: DocumentType;
};
