"use client";

/**
 * OperatorDocumentReviewCard — renders a single pending document for review.
 *
 * Actions:
 *   Approve → PATCH /api/v1/operator/documents/:id/approve
 *   Reject  → PATCH /api/v1/operator/documents/:id/reject (requires reason, 5–500 chars)
 *
 * Security:
 * - fileUrl is a temporary S3 presigned URL. Opened only via user click.
 * - fileUrl is NOT stored in state beyond initial prop — opened directly.
 * - fileKey is NEVER exposed in the UI or logs.
 * - "Document links expire and are generated for review." shown to operator.
 *
 * UI contract:
 * - Both buttons disabled while any mutation is pending.
 * - No optimistic status update — queue refetch only after confirmed backend success.
 * - Conflict (409) shows backend message and triggers refetch (doc already reviewed).
 * - Rejection reason: min 5 chars, max 500 (mirrors backend RejectDocumentDto).
 */

import { useState, useId } from "react";
import { CheckCircle2, XCircle, ExternalLink, Clock, User, FileText, AlertTriangle, Loader2 } from "lucide-react";
import { clientFetch } from "@/lib/api/client-fetch";
import { normalizeApiError } from "@/lib/api/errors";
import type { PendingDocumentViewModel, DocumentActionState } from "./types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type OperatorDocumentReviewCardProps = {
  doc: PendingDocumentViewModel;
  /** Called after a successful approve or reject — triggers queue refetch. */
  onReviewed: (docId: string) => void;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function OperatorDocumentReviewCard({
  doc,
  onReviewed,
}: OperatorDocumentReviewCardProps) {
  const [actionState, setActionState] = useState<DocumentActionState>("idle");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackKind, setFeedbackKind] = useState<"success" | "error">("success");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const reasonId = useId();
  const feedbackId = useId();

  const isBusy = actionState === "approving" || actionState === "rejecting";

  // ---------------------------------------------------------------------------
  // Approve
  // ---------------------------------------------------------------------------

  async function handleApprove() {
    setActionState("approving");
    setFeedbackMessage(null);
    setShowRejectForm(false);

    try {
      await clientFetch<unknown>(
        `/operator/documents/${doc.id}/approve`,
        { method: "PATCH" },
      );
      setActionState("success");
      setFeedbackKind("success");
      setFeedbackMessage("Document approved.");
      onReviewed(doc.id);
    } catch (err) {
      const normalized = normalizeApiError(err);
      setActionState("error");
      setFeedbackKind("error");
      setFeedbackMessage(normalized.message || "Approval failed. Please try again.");
      // If conflict (already reviewed), also refetch queue to sync state
      if (normalized.kind === "conflict") {
        onReviewed(doc.id);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Reject
  // ---------------------------------------------------------------------------

  async function handleReject() {
    const trimmed = rejectionReason.trim();
    if (trimmed.length < 5) return; // Validation gate

    setActionState("rejecting");
    setFeedbackMessage(null);

    try {
      await clientFetch<unknown>(
        `/operator/documents/${doc.id}/reject`,
        {
          method: "PATCH",
          body: { reason: trimmed },
        },
      );
      setActionState("success");
      setFeedbackKind("success");
      setFeedbackMessage("Document rejected. Customer notified via SSE.");
      onReviewed(doc.id);
    } catch (err) {
      const normalized = normalizeApiError(err);
      setActionState("error");
      setFeedbackKind("error");
      setFeedbackMessage(normalized.message || "Rejection failed. Please try again.");
      if (normalized.kind === "conflict") {
        onReviewed(doc.id);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const docTypeLabel = doc.type === "PASSPORT" ? "Passport" : "Driving Licence";
  const reasonTooShort = rejectionReason.trim().length < 5;

  return (
    <article
      className="overflow-hidden rounded-lg border border-[var(--nx-line)] bg-white"
      aria-label={`${docTypeLabel} document for ${doc.customerName}`}
    >
      {/* Card header */}
      <div className="flex items-start justify-between gap-4 border-b border-[var(--nx-line)] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-neutral-100">
            <FileText aria-hidden="true" className="h-4 w-4 text-neutral-600" />
          </div>
          <div>
            <p className="text-sm font-black text-neutral-950">{docTypeLabel}</p>
            <p className="text-xs text-neutral-500">
              <span className="inline-flex items-center gap-1">
                <User aria-hidden="true" className="h-3 w-3" />
                {doc.customerName}
              </span>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800">
            <Clock aria-hidden="true" className="h-3 w-3" />
            Pending review
          </span>
          <span className="text-xs text-neutral-400">{doc.uploadedAgo} ago</span>
        </div>
      </div>

      {/* Document preview + info */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-neutral-500">Reservation</p>
            <p className="font-mono text-xs text-neutral-950">
              {doc.reservationId.toUpperCase().slice(0, 8)}
            </p>
          </div>
          {/* Open document — uses transient fileUrl, never stored */}
          <a
            href={doc.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[var(--nx-line)] bg-neutral-50 px-4 text-xs font-bold text-neutral-950 transition hover:bg-neutral-100"
            aria-label={`Open ${docTypeLabel} document (link expires after use)`}
          >
            <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
            Open document
          </a>
        </div>
        <p className="mt-2 text-[11px] text-neutral-400 italic">
          Document links expire and are generated for review. Do not share.
        </p>
      </div>

      {/* Feedback banner */}
      {feedbackMessage && (
        <div
          id={feedbackId}
          role={feedbackKind === "error" ? "alert" : "status"}
          aria-live={feedbackKind === "error" ? "assertive" : "polite"}
          className={`mx-5 mb-3 flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm font-bold ${
            feedbackKind === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {feedbackKind === "success" ? (
            <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle aria-hidden="true" className="h-4 w-4 shrink-0" />
          )}
          {feedbackMessage}
        </div>
      )}

      {/* Reject reason form */}
      {showRejectForm && (
        <div className="border-t border-[var(--nx-line)] bg-neutral-50 px-5 py-4">
          <label
            htmlFor={reasonId}
            className="block text-sm font-black text-neutral-950"
          >
            Rejection reason{" "}
            <span className="text-red-600" aria-hidden="true">*</span>
          </label>
          <p className="mt-0.5 text-xs text-neutral-500">
            Required. Minimum 5 characters. This will be shown to the customer.
          </p>
          <textarea
            id={reasonId}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            disabled={isBusy}
            maxLength={500}
            rows={3}
            className="mt-2 w-full resize-none rounded-md border border-[var(--nx-line)] bg-white px-3 py-2 text-sm text-neutral-950 placeholder-neutral-400 focus:border-neutral-400 focus:outline-none disabled:opacity-50"
            placeholder="e.g. Document is blurred or cut off — please re-upload."
            aria-required="true"
            aria-describedby={
              reasonTooShort && rejectionReason.length > 0
                ? `${reasonId}-error`
                : undefined
            }
          />
          {reasonTooShort && rejectionReason.length > 0 && (
            <p
              id={`${reasonId}-error`}
              className="mt-1 text-xs text-red-600"
              role="alert"
            >
              Reason must be at least 5 characters.
            </p>
          )}
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleReject}
              disabled={isBusy || reasonTooShort}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-red-700 px-4 text-sm font-bold text-white transition hover:bg-red-800 disabled:opacity-50"
              aria-label={`Confirm rejection of ${docTypeLabel} for ${doc.customerName}`}
            >
              {actionState === "rejecting" ? (
                <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <XCircle aria-hidden="true" className="h-3.5 w-3.5" />
              )}
              {actionState === "rejecting" ? "Rejecting…" : "Confirm rejection"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowRejectForm(false);
                setRejectionReason("");
              }}
              disabled={isBusy}
              className="inline-flex min-h-9 items-center rounded-md border border-[var(--nx-line)] bg-white px-4 text-sm font-bold text-neutral-950 transition hover:bg-neutral-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {actionState !== "success" && (
        <div className="flex items-center gap-2 border-t border-[var(--nx-line)] px-5 py-4">
          <button
            type="button"
            onClick={handleApprove}
            disabled={isBusy || showRejectForm}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-md bg-green-700 px-5 text-sm font-bold text-white transition hover:bg-green-800 disabled:opacity-50"
            aria-label={`Approve ${docTypeLabel} for ${doc.customerName}`}
          >
            {actionState === "approving" ? (
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
            )}
            {actionState === "approving" ? "Approving…" : "Approve"}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowRejectForm(!showRejectForm);
              setFeedbackMessage(null);
            }}
            disabled={isBusy}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-red-300 bg-white px-5 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
            aria-label={`Reject ${docTypeLabel} for ${doc.customerName} — will prompt for reason`}
            aria-expanded={showRejectForm}
          >
            <XCircle aria-hidden="true" className="h-4 w-4" />
            Reject
          </button>
        </div>
      )}
    </article>
  );
}
