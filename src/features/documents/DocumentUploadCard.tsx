"use client";

/**
 * DocumentUploadCard — individual document upload card for PASSPORT or DRIVING_LICENSE.
 *
 * Handles the full presign → S3 PUT → confirm lifecycle per document slot.
 * All state is local to this component. No external upload library required.
 *
 * Resilience features:
 * - File type validation before any API call (client-side MIME check)
 * - File size warning (no hard block — backend validates authoritatively)
 * - Upload progress via XHR
 * - Confirm-failed recovery: shows retry button with pendingFileKey reuse
 * - Error displayed with role="alert"
 * - Upload disabled while any step is in progress
 * - No fake completion — document.status is always from server confirm response
 *
 * Accessibility:
 * - Visible label for file input
 * - Accepted file types guidance
 * - Errors use role="alert"
 * - Progress changes use aria-live="polite"
 * - Submit button disabled while uploading
 * - All interactive elements keyboard usable
 */

import { useRef, useState, useId, useCallback } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  RefreshCw,
  FileText,
  X,
  Loader2,
} from "lucide-react";
import type { DocumentType, DocumentViewModel, UploadState } from "./types";
import { ALLOWED_DOCUMENT_MIME_TYPES, isAllowedMimeType } from "./types";
import {
  uploadDocument,
  retryConfirmDocument,
} from "./document-upload-service";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type DocumentUploadCardProps = {
  reservationId: string;
  type: DocumentType;
  label: string;
  /** Existing document from initial server fetch (null = not uploaded yet) */
  existingDocument: DocumentViewModel | null;
  /**
   * Called after a successful confirm, with the updated document.
   * Parent refetches all documents on success.
   */
  onUploadSuccess: (doc: DocumentViewModel) => void;
};

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  DocumentViewModel["status"],
  { label: string; badgeClass: string; icon: typeof CheckCircle2 }
> = {
  PENDING_REVIEW: {
    label: "Pending review",
    badgeClass: "border-amber-200 bg-amber-50 text-amber-800",
    icon: Loader2,
  },
  APPROVED: {
    label: "Approved",
    badgeClass: "border-green-200 bg-green-50 text-green-800",
    icon: CheckCircle2,
  },
  REJECTED: {
    label: "Rejected",
    badgeClass: "border-red-200 bg-red-50 text-red-800",
    icon: AlertTriangle,
  },
};

const STEP_LABELS: Record<UploadState, string> = {
  idle: "",
  selecting: "Select file…",
  presigning: "Preparing upload…",
  uploading: "Uploading…",
  confirming: "Confirming…",
  done: "Submitted",
  error: "Upload failed",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ---------------------------------------------------------------------------
// DocumentUploadCard component
// ---------------------------------------------------------------------------

export function DocumentUploadCard({
  reservationId,
  type,
  label,
  existingDocument,
  onUploadSuccess,
}: DocumentUploadCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<{
    message: string;
    recoverable: boolean;
    confirmFailed?: boolean;
    pendingFileKey?: string;
    pendingType?: DocumentType;
  } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Use the existing document unless we just successfully uploaded
  const [currentDoc, setCurrentDoc] = useState<DocumentViewModel | null>(
    existingDocument,
  );

  const labelId = useId();
  const errorId = useId();
  const progressId = useId();

  const isUploading =
    uploadState === "presigning" ||
    uploadState === "uploading" ||
    uploadState === "confirming";

  // ---------------------------------------------------------------------------
  // File selection handler
  // ---------------------------------------------------------------------------

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setError(null);

    if (!file) {
      setSelectedFile(null);
      setUploadState("idle");
      return;
    }

    // Client-side MIME validation (backend validates authoritatively)
    if (!isAllowedMimeType(file.type)) {
      setError({
        message: `File type "${file.type}" is not accepted. Please upload a JPEG, PNG, or PDF.`,
        recoverable: true,
      });
      setSelectedFile(null);
      // Reset input so user can reselect
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setSelectedFile(file);
    setUploadState("selecting");
    setProgress(0);
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (isUploading) return;
    setIsDragging(true);
  }, [isUploading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isUploading) return;

    const file = e.dataTransfer.files?.[0] ?? null;
    setError(null);

    if (!file) return;

    if (!isAllowedMimeType(file.type)) {
      setError({
        message: `File type "${file.type}" is not accepted. Please upload a JPEG, PNG, or PDF.`,
        recoverable: true,
      });
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setUploadState("selecting");
    setProgress(0);
  }, [isUploading]);

  // ---------------------------------------------------------------------------
  // Upload handler
  // ---------------------------------------------------------------------------

  const handleUpload = useCallback(async () => {
    if (!selectedFile || isUploading) return;

    setError(null);
    setProgress(0);
    setUploadState("presigning");

    const result = await uploadDocument(
      reservationId,
      type,
      selectedFile,
      (percent) => {
        setUploadState("uploading");
        setProgress(percent);
      },
    );

    if (!result.ok) {
      setUploadState("error");
      setError({
        message: result.message,
        recoverable: result.recoverable,
        confirmFailed: result.confirmFailed,
        pendingFileKey: result.pendingFileKey,
        pendingType: result.pendingType,
      });
      return;
    }

    // Success — update local doc, notify parent
    setUploadState("done");
    setCurrentDoc(result.document);
    setSelectedFile(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onUploadSuccess(result.document);
  }, [selectedFile, isUploading, reservationId, type, onUploadSuccess]);

  // ---------------------------------------------------------------------------
  // Retry confirm handler (for confirm-step failures)
  // ---------------------------------------------------------------------------

  const handleRetryConfirm = useCallback(async () => {
    if (!error?.confirmFailed || !error.pendingFileKey || !error.pendingType)
      return;

    setUploadState("confirming");
    setError(null);

    const result = await retryConfirmDocument(
      reservationId,
      error.pendingType,
      error.pendingFileKey,
    );

    if (!result.ok) {
      setUploadState("error");
      setError({
        message: result.message,
        recoverable: result.recoverable,
        confirmFailed: result.confirmFailed,
        pendingFileKey: result.pendingFileKey,
        pendingType: result.pendingType,
      });
      return;
    }

    setUploadState("done");
    setCurrentDoc(result.document);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onUploadSuccess(result.document);
  }, [error, reservationId, onUploadSuccess]);

  // ---------------------------------------------------------------------------
  // Clear selection
  // ---------------------------------------------------------------------------

  function handleClearFile() {
    setSelectedFile(null);
    setUploadState("idle");
    setError(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const statusConfig = currentDoc ? STATUS_CONFIG[currentDoc.status] : null;
  const StatusIcon = statusConfig?.icon;

  return (
    <div className="rounded-lg border border-[var(--nx-line)] bg-white">
      {/* Card header */}
      <div className="flex items-center justify-between border-b border-[var(--nx-line)] px-6 py-4">
        <div className="flex items-center gap-2">
          <FileText
            aria-hidden="true"
            className="h-4 w-4 text-[var(--nx-accent)]"
          />
          <h3 className="text-sm font-black text-neutral-950" id={labelId}>
            {label}
          </h3>
        </div>
        {/* Status badge from backend */}
        {statusConfig && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${statusConfig.badgeClass}`}
          >
            {StatusIcon && (
              <StatusIcon
                aria-hidden="true"
                className={`h-3 w-3 ${
                  currentDoc?.status === "PENDING_REVIEW"
                    ? "animate-spin"
                    : ""
                }`}
              />
            )}
            {statusConfig.label}
          </span>
        )}
      </div>

      <div className="px-6 py-5 space-y-4">
        {/* Approved — no re-upload allowed */}
        {currentDoc?.status === "APPROVED" ? (
          <div className="flex items-start gap-3 rounded-md border border-green-200 bg-green-50 px-4 py-3">
            <CheckCircle2
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0 text-green-600"
            />
            <div>
              <p className="text-sm font-bold text-green-900">Document approved</p>
              <p className="mt-0.5 text-sm text-green-800">
                This document has been reviewed and approved by an operator.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Pending review — submitted but not yet reviewed */}
            {currentDoc?.status === "PENDING_REVIEW" && (
              <div
                aria-live="polite"
                className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3"
              >
                <Loader2
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-amber-600"
                />
                <div>
                  <p className="text-sm font-bold text-amber-900">
                    Awaiting review
                  </p>
                  <p className="mt-0.5 text-sm text-amber-800">
                    Your document has been submitted and is awaiting operator
                    review. You can replace it by uploading a new file below.
                  </p>
                </div>
              </div>
            )}

            {/* Rejected — show reason and allow re-upload */}
            {currentDoc?.status === "REJECTED" && (
              <div
                className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3"
                role="alert"
              >
                <AlertTriangle
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 shrink-0 text-red-600"
                />
                <div>
                  <p className="text-sm font-bold text-red-900">
                    Document rejected
                  </p>
                  {currentDoc.rejectionReason && (
                    <p className="mt-0.5 text-sm text-red-800">
                      Reason: {currentDoc.rejectionReason}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-red-700">
                    Please upload a new, clear photo or scan of your{" "}
                    {label.toLowerCase()}.
                  </p>
                </div>
              </div>
            )}

            {/* Error from upload */}
            {error && (
              <div
                className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3"
                id={errorId}
                role="alert"
              >
                <AlertTriangle
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 shrink-0 text-red-600"
                />
                <div className="flex-1">
                  <p className="text-sm font-bold text-red-900">
                    Upload failed
                  </p>
                  <p className="mt-0.5 text-sm text-red-800">
                    {error.message}
                  </p>
                  {/* Confirm-failed recovery — retry without re-uploading */}
                  {error.confirmFailed && error.pendingFileKey && (
                    <button
                      className="mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-md bg-red-800 px-4 text-xs font-bold text-white transition hover:bg-red-900 disabled:opacity-60"
                      disabled={isUploading}
                      onClick={handleRetryConfirm}
                      type="button"
                    >
                      <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
                      Retry confirmation
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Upload progress */}
            {uploadState === "uploading" && (
              <div aria-live="polite" id={progressId}>
                <div className="flex justify-between text-xs text-neutral-500 mb-1">
                  <span>Uploading…</span>
                  <span>{progress}%</span>
                </div>
                <div
                  aria-label={`Upload progress: ${progress}%`}
                  aria-valuemax={100}
                  aria-valuemin={0}
                  aria-valuenow={progress}
                  className="h-2 w-full overflow-hidden rounded-full bg-neutral-200"
                  role="progressbar"
                >
                  <div
                    className="h-full rounded-full bg-neutral-950 transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Processing state (presigning / confirming) */}
            {(uploadState === "presigning" || uploadState === "confirming") && (
              <div aria-live="polite" className="flex items-center gap-2 text-sm text-neutral-600">
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                {STEP_LABELS[uploadState]}
              </div>
            )}

            {/* File input */}
            <div>
              <label
                className="mb-2.5 block text-xs font-bold text-neutral-700 uppercase tracking-wider"
                htmlFor={`file-input-${type}`}
              >
                {currentDoc
                  ? `Replace ${label.toLowerCase()}`
                  : `Upload ${label.toLowerCase()}`}
              </label>
              <input
                accept={ALLOWED_DOCUMENT_MIME_TYPES.join(",")}
                aria-describedby={error ? errorId : undefined}
                aria-labelledby={labelId}
                className="sr-only"
                disabled={isUploading}
                id={`file-input-${type}`}
                onChange={handleFileChange}
                ref={fileInputRef}
                type="file"
              />

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => {
                  if (!isUploading) {
                    fileInputRef.current?.click();
                  }
                }}
                className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-300 select-none active:scale-[0.98] ${
                  isDragging
                    ? "border-[#1E41FC] bg-[#1E41FC]/5 scale-[0.99]"
                    : "border-neutral-200 bg-neutral-50 hover:bg-neutral-100/70 hover:border-neutral-400"
                } ${isUploading ? "pointer-events-none opacity-60" : ""}`}
              >
                <UploadCloud
                  className={`h-9 w-9 transition-transform duration-300 ${
                    isDragging ? "scale-110 text-[#1E41FC]" : "text-neutral-400 group-hover:text-neutral-600"
                  }`}
                />
                <span className="mt-3 text-xs font-semibold text-neutral-800">
                  {selectedFile ? "Selected: " + selectedFile.name : `Drag & drop your ${label.toLowerCase()} here`}
                </span>
                <span className="text-[10px] text-neutral-400 font-light mt-1.5">
                  {selectedFile ? "Click or drag to change" : "or click to browse files"}
                </span>
              </div>

              {/* Selected file preview */}
              {selectedFile && !isUploading && (
                <div className="mt-4 flex items-center justify-between rounded-xl bg-neutral-50 border border-neutral-200 px-4 py-3 text-xs">
                  <div className="flex items-center gap-2 text-neutral-700 min-w-0">
                    <FileText className="h-4 w-4 text-neutral-400 shrink-0" />
                    <span className="truncate font-semibold">{selectedFile.name}</span>
                    <span className="text-neutral-400 shrink-0">({formatFileSize(selectedFile.size)})</span>
                  </div>
                  <button
                    aria-label="Remove selected file"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 transition-all duration-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 active:scale-[0.93]"
                    onClick={handleClearFile}
                    type="button"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Upload submit button */}
            <button
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-neutral-950 px-5 text-sm font-black text-white transition disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!selectedFile || isUploading}
              onClick={handleUpload}
              type="button"
            >
              {isUploading ? (
                <>
                  <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                  {STEP_LABELS[uploadState]}
                </>
              ) : (
                <>
                  <UploadCloud aria-hidden="true" className="h-4 w-4" />
                  {currentDoc ? `Replace ${label}` : `Submit ${label}`}
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
