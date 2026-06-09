"use client";

/**
 * OperatorDocumentsView — live document review queue.
 *
 * Receives initial pending documents from server.
 * Refreshes the queue after each approve/reject action.
 *
 * Architecture:
 * - Initial server fetch in page.tsx (no spinner on first paint)
 * - Client-side refetch triggered by onReviewed callback from each card
 * - No SSE in this route (SSE from operator/deliveries stream is for delivery
 *   dashboard; document events are customer-facing via sse/reservation/:id)
 *
 * Security:
 * - fileUrl is NOT stored across refetches — each refetch gets fresh presigned URLs
 * - No fileKey ever touched in UI layer
 */

import { useState, useCallback } from "react";
import { RefreshCw, ClipboardCheck, AlertTriangle } from "lucide-react";
import { clientFetch } from "@/lib/api/client-fetch";
import { adaptPendingDocuments } from "./operator-adapters";
import { OperatorDocumentReviewCard } from "./OperatorDocumentReviewCard";
import type { PendingDocumentViewModel, PendingDocumentsApiResponse } from "./types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type OperatorDocumentsViewProps = {
  initialDocuments: PendingDocumentViewModel[];
};

// ---------------------------------------------------------------------------
// OperatorDocumentsView
// ---------------------------------------------------------------------------

export function OperatorDocumentsView({
  initialDocuments,
}: OperatorDocumentsViewProps) {
  const [documents, setDocuments] =
    useState<PendingDocumentViewModel[]>(initialDocuments);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Refetch pending queue
  // ---------------------------------------------------------------------------

  const refetchQueue = useCallback(async () => {
    setIsRefreshing(true);
    setRefreshError(null);

    try {
      const raw = await clientFetch<PendingDocumentsApiResponse>(
        "/operator/documents/pending",
      );
      // Each refetch returns fresh presigned S3 URLs — not cached
      const adapted = adaptPendingDocuments(raw);
      setDocuments(adapted);
      setLastRefreshedAt(new Date().toISOString());
    } catch {
      setRefreshError(
        "Failed to refresh document queue. Please try again.",
      );
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Called by each card after a successful approve/reject
  const handleReviewed = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_reviewedDocId: string) => {
      // Refetch the whole queue — fresh presigned S3 URLs for remaining docs
      refetchQueue();
    },
    [refetchQueue],
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <section className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-100 pb-5">
        <div className="flex items-center gap-2.5">
          <ClipboardCheck
            aria-hidden="true"
            className="h-5 w-5 text-neutral-700"
          />
          <h2 className="text-base font-bold uppercase tracking-wider text-neutral-905">
            Pending review queue
          </h2>
          {documents.length > 0 && (
            <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-850">
              {documents.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {lastRefreshedAt && (
            <span className="text-xs text-neutral-400 font-light">
              Updated {formatTime(lastRefreshedAt)}
            </span>
          )}
          <button
            type="button"
            onClick={refetchQueue}
            disabled={isRefreshing}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 text-xs font-bold uppercase tracking-wider text-neutral-900 transition hover:bg-neutral-50 hover:border-neutral-300 disabled:opacity-50 shadow-sm"
            aria-label="Refresh pending document queue"
          >
            <RefreshCw
              aria-hidden="true"
              className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Refresh error */}
      {refreshError && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-800"
        >
          <AlertTriangle aria-hidden="true" className="h-4 w-4 shrink-0" />
          {refreshError}
        </div>
      )}

      {/* Empty state */}
      {documents.length === 0 && !isRefreshing && (
        <div className="flex flex-col items-center justify-center rounded-[1.25rem] border border-neutral-200 bg-white py-16 text-center shadow-sm">
          <ClipboardCheck
            aria-hidden="true"
            className="h-12 w-12 text-neutral-300 stroke-1"
          />
          <p className="mt-4 text-sm font-semibold text-neutral-900">
            No pending documents
          </p>
          <p className="mt-1 text-xs text-neutral-450 font-light">
            All submitted documents have been reviewed.
          </p>
        </div>
      )}

      {/* Document cards */}
      {documents.length > 0 && (
        <div
          className="space-y-5"
          aria-label={`${documents.length} document${documents.length !== 1 ? "s" : ""} awaiting review`}
          aria-live="polite"
          aria-atomic="false"
        >
          {documents.map((doc) => (
            <OperatorDocumentReviewCard
              key={doc.id}
              doc={doc}
              onReviewed={handleReviewed}
            />
          ))}
        </div>
      )}
    </section>
  );
}
