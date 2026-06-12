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
      className="overflow-hidden rounded-[1.25rem] border border-neutral-200 bg-white shadow-sm hover:border-neutral-300 transition-colors duration-300"
      aria-label={`${docTypeLabel} document for ${doc.customerName}`}
    >
      {/* Card header */}
      <div className="flex items-start justify-between gap-4 border-b border-neutral-100 px-6 py-4 bg-neutral-50/50">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 border border-neutral-200/50">
            <FileText aria-hidden="true" className="h-5 w-5 text-neutral-600" />
          </div>
          <div>
            <p className="text-[1.05rem] font-display font-semibold text-neutral-900">{docTypeLabel}</p>
            <p className="text-xs text-neutral-500 mt-0.5">
              <span className="inline-flex items-center gap-1.5">
                <User aria-hidden="true" className="h-3.5 w-3.5 text-neutral-400" />
                <span className="font-medium">{doc.customerName}</span>
              </span>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-800">
            <Clock aria-hidden="true" className="h-3 w-3" />
            Pending review
          </span>
          <span className="text-[10px] text-neutral-500 font-light">{doc.uploadedAgo} ago</span>
        </div>
      </div>

      {/* Document preview + info */}
      <div className="px-6 py-5">
        <div className="flex flex-col md:flex-row gap-5">
          {/* Left: Inline Preview with onError fallback */}
          <div className="relative aspect-[16/10] md:aspect-[4/3] w-full md:w-60 shrink-0 rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50 flex items-center justify-center group/preview">
            {doc.fileUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={doc.fileUrl}
                alt={`${docTypeLabel} preview`}
                className="object-contain w-full h-full p-2 transition-transform duration-500 group-hover/preview:scale-[1.03]"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = "none";
                  const fallback = e.currentTarget.nextElementSibling;
                  if (fallback) (fallback as HTMLElement).classList.remove("hidden");
                }}
              />
            ) : null}
            <div className="hidden absolute inset-0 flex flex-col items-center justify-center text-neutral-400 text-[10px] font-semibold uppercase tracking-wider p-4">
              <FileText className="w-8 h-8 text-neutral-300 mb-2 stroke-1" />
              <span>PDF / Document</span>
            </div>
          </div>

          {/* Right: Info details */}
          <div className="flex-1 flex flex-col justify-between">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold font-mono">Reservation</p>
                <p className="font-mono text-sm font-semibold text-neutral-950 mt-1">
                  {doc.reservationId.toUpperCase().slice(0, 8)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold font-mono">Document type</p>
                <p className="text-sm font-semibold text-neutral-950 mt-1">
                  {docTypeLabel}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] text-neutral-500 italic">
                Presigned review link is private &amp; time-limited.
              </p>
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 text-xs font-bold text-neutral-900 transition hover:bg-neutral-50 hover:border-neutral-300 shadow-sm"
                aria-label={`Open ${docTypeLabel} document (link expires after use)`}
              >
                <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
                Open full screen
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback banner */}
      {feedbackMessage && (
        <div
          id={feedbackId}
          role={feedbackKind === "error" ? "alert" : "status"}
          aria-live={feedbackKind === "error" ? "assertive" : "polite"}
          className={`mx-6 mb-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-semibold ${
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
        <div className="border-t border-neutral-100 bg-neutral-50 px-6 py-5 space-y-3">
          <div>
            <label
              htmlFor={reasonId}
              className="block text-xs font-bold uppercase tracking-wider text-neutral-800"
            >
              Rejection reason{" "}
              <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <p className="mt-1 text-[11px] text-neutral-500 font-light">
              Required. Describe clearly what needs to be fixed. The customer sees this instantly.
            </p>
          </div>
          <textarea
            id={reasonId}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            disabled={isBusy}
            maxLength={500}
            rows={3}
            className="w-full resize-none rounded-xl border border-neutral-200 bg-white px-4 py-3 text-xs text-neutral-900 placeholder-neutral-400 focus:border-neutral-400 focus:outline-none disabled:opacity-50 shadow-inner"
            placeholder="e.g. Document is blurred or cut off — please re-upload a clear image of the entire page."
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
              className="text-[11px] text-red-655 font-medium"
              role="alert"
            >
              Reason must be at least 5 characters.
            </p>
          )}
          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleReject}
              disabled={isBusy || reasonTooShort}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-red-600 hover:bg-red-750 px-5 text-xs font-bold uppercase tracking-wider text-white transition-colors duration-300 disabled:opacity-50 shadow-sm"
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
              className="inline-flex h-9 items-center rounded-full border border-neutral-200 bg-white hover:bg-neutral-50 px-5 text-xs font-bold uppercase tracking-wider text-neutral-800 transition-colors duration-300 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {actionState !== "success" && (
        <div className="flex items-center gap-3 border-t border-neutral-100 px-6 py-4 bg-neutral-50/20">
          <button
            type="button"
            onClick={handleApprove}
            disabled={isBusy || showRejectForm}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 px-6 text-xs font-bold uppercase tracking-wider text-white transition-colors duration-300 disabled:opacity-50 shadow-sm"
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
            className={`inline-flex h-10 items-center gap-1.5 rounded-full border px-6 text-xs font-bold uppercase tracking-wider transition-colors duration-300 disabled:opacity-50 shadow-sm ${
              showRejectForm
                ? "bg-neutral-900 border-neutral-900 text-white"
                : "border-red-200 bg-white hover:bg-red-50 text-red-650 hover:text-red-750"
            }`}
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
