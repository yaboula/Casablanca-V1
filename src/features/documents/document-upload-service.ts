/**
 * document-upload-service.ts — client-side document upload flow.
 *
 * Implements the three-step presign → S3 PUT → confirm lifecycle.
 * Called only from client components.
 *
 * Upload lifecycle:
 * 1. POST /documents/presign → { uploadUrl, fileKey }
 * 2. PUT uploadUrl (direct to S3, binary, no auth header, Content-Type from mimeType)
 * 3. POST /documents/confirm → { data: document }
 *
 * Resilience rules:
 * - If presign fails, report presign error — no file was touched.
 * - If S3 PUT fails, report upload error — confirm should NOT be called (nothing was uploaded).
 * - If confirm fails after S3 PUT succeeded, report confirmFailed=true with the fileKey
 *   so the caller can offer a retry confirm without re-uploading.
 * - Never silently retry an expired presigned URL.
 * - Progress callback is called during XHR upload (0-100).
 */

import { clientFetch } from "@/lib/api/client-fetch";
import { adaptPresignResponse } from "./document-adapters";
import type {
  ConfirmDocumentRequest,
  DocumentConfirmApiResponse,
  DocumentMimeType,
  DocumentType,
  DocumentViewModel,
  PresignDocumentRequest,
} from "./types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PresignResult = {
  uploadUrl: string;
  fileKey: string;
};

export type UploadResult =
  | { ok: true; document: DocumentViewModel }
  | {
      ok: false;
      message: string;
      recoverable: boolean;
      confirmFailed?: true;
      pendingFileKey?: string;
      pendingType?: DocumentType;
    };

async function uploadFileToBypassStorage(
  reservationId: string,
  type: DocumentType,
  fileKey: string,
  file: File,
  mimeType: DocumentMimeType,
  onProgress?: (percent: number) => void,
): Promise<void> {
  const base64 = await fileToBase64(file, onProgress);

  await clientFetch<unknown>("/documents/dev-upload", {
    method: "POST",
    body: {
      reservationId,
      type,
      fileKey,
      mimeType,
      base64,
    },
  });
}

function fileToBase64(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.max(5, Math.round((event.loaded / event.total) * 90)));
      }
    };

    reader.onerror = () => {
      reject(new Error("Could not read the selected file."));
    };

    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Could not encode the selected file."));
        return;
      }

      const commaIndex = result.indexOf(",");
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
    };

    reader.readAsDataURL(file);
  });
}

// ---------------------------------------------------------------------------
// Step 1: Presign
// ---------------------------------------------------------------------------

export async function presignDocument(
  request: PresignDocumentRequest,
): Promise<PresignResult> {
  const raw = await clientFetch<unknown>(`/documents/presign`, {
    method: "POST",
    body: request as unknown as Record<string, unknown>,
  });

  const presign = adaptPresignResponse(raw);
  if (!presign) {
    throw new Error(
      "Invalid presign response from server. Please try again.",
    );
  }

  return presign;
}

// ---------------------------------------------------------------------------
// Step 2: Direct S3 upload via XHR (for progress tracking)
// ---------------------------------------------------------------------------

export async function uploadFileToS3(
  uploadUrl: string,
  file: File,
  mimeType: DocumentMimeType,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(
          new Error(
            `Upload failed with status ${xhr.status}. Please try again.`,
          ),
        );
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Network error during upload. Please check your connection and try again."));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("Upload was cancelled."));
    });

    xhr.open("PUT", uploadUrl);
    // S3 presigned PUT requires the Content-Type to match what was used in presign
    xhr.setRequestHeader("Content-Type", mimeType);
    xhr.send(file);
  });
}

// ---------------------------------------------------------------------------
// Step 3: Confirm
// ---------------------------------------------------------------------------

export async function confirmDocument(
  request: ConfirmDocumentRequest,
): Promise<DocumentViewModel | null> {
  const response = await clientFetch<DocumentConfirmApiResponse>(
    `/documents/confirm`,
    {
      method: "POST",
      body: request as unknown as Record<string, unknown>,
    },
  );

  // Backend returns { data: document } — adapt it
  if (!response?.data) return null;

  const { adaptDocument } = await import("./document-adapters");
  return adaptDocument(response.data);
}

// ---------------------------------------------------------------------------
// Full upload flow: presign + upload + confirm
// ---------------------------------------------------------------------------

/**
 * Runs the complete three-step upload flow for a single document.
 *
 * Returns UploadResult:
 * - { ok: true, document } on full success
 * - { ok: false, message, recoverable, confirmFailed, pendingFileKey, pendingType }
 *   on any failure, with enough context to retry the confirm step.
 */
export async function uploadDocument(
  reservationId: string,
  type: DocumentType,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<UploadResult> {
  const mimeType = file.type as DocumentMimeType;

  // ---------------------------------------------------------------------------
  // Step 1: Presign
  // ---------------------------------------------------------------------------
  let presign: PresignResult;
  try {
    presign = await presignDocument({ reservationId, type, mimeType });
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof Error
          ? err.message
          : "Could not prepare upload. Please try again.",
      recoverable: true,
    };
  }

  // ---------------------------------------------------------------------------
  // Step 2: Upload to S3
  // ---------------------------------------------------------------------------
  try {
    if (presign.uploadUrl === "bypass") {
      await uploadFileToBypassStorage(
        reservationId,
        type,
        presign.fileKey,
        file,
        mimeType,
        onProgress,
      );
      onProgress?.(100);
    } else {
      await uploadFileToS3(presign.uploadUrl, file, mimeType, onProgress);
    }
  } catch (err) {
    // S3 upload failed — presigned URL is now consumed/invalid.
    // User must get a new presigned URL by starting over.
    return {
      ok: false,
      message:
        err instanceof Error
          ? err.message
          : "File upload failed. Please try again.",
      recoverable: true, // recoverable by re-starting (new presign)
    };
  }

  // ---------------------------------------------------------------------------
  // Step 3: Confirm
  // ---------------------------------------------------------------------------
  let document: DocumentViewModel | null;
  try {
    document = await confirmDocument({
      fileKey: presign.fileKey,
      reservationId,
      type,
    });
  } catch (err) {
    // Confirm failed after a successful S3 upload.
    // The file is in S3 but not confirmed — user can retry confirm
    // with the same fileKey without re-uploading.
    return {
      ok: false,
      message:
        err instanceof Error
          ? err.message
          : "Upload succeeded but confirmation failed. You can retry without re-uploading.",
      recoverable: true,
      confirmFailed: true,
      pendingFileKey: presign.fileKey,
      pendingType: type,
    };
  }

  if (!document) {
    return {
      ok: false,
      message: "Document was submitted but the server response was invalid.",
      recoverable: false,
    };
  }

  return { ok: true, document };
}

// ---------------------------------------------------------------------------
// Retry confirm only (for confirmFailed recovery)
// ---------------------------------------------------------------------------

export async function retryConfirmDocument(
  reservationId: string,
  type: DocumentType,
  fileKey: string,
): Promise<UploadResult> {
  let document: DocumentViewModel | null;
  try {
    document = await confirmDocument({ fileKey, reservationId, type });
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof Error
          ? err.message
          : "Confirmation retry failed. Try uploading again.",
      recoverable: true,
      confirmFailed: true,
      pendingFileKey: fileKey,
      pendingType: type,
    };
  }

  if (!document) {
    return {
      ok: false,
      message: "Confirmation response was invalid. Try uploading again.",
      recoverable: false,
    };
  }

  return { ok: true, document };
}
