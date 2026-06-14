"use client";

/**
 * OperatorDocumentsView - live document review queue.
 *
 * Receives initial pending documents from server.
 * Refreshes the queue after each approve/reject action.
 */

import { useCallback, useState } from "react";
import { AlertTriangle, ClipboardCheck, RefreshCw } from "lucide-react";
import { clientFetch } from "@/lib/api/client-fetch";
import { useOperatorDocumentsSse } from "@/hooks/useOperatorDeliveriesSse";
import { adaptPendingDocuments } from "./operator-adapters";
import { formatOperatorTime } from "./datetime";
import { OperatorDocumentReviewCard } from "./OperatorDocumentReviewCard";
import type {
  PendingDocumentViewModel,
  PendingDocumentsApiResponse,
} from "./types";

type OperatorDocumentsViewProps = {
  initialDocuments: PendingDocumentViewModel[];
};

export function OperatorDocumentsView({
  initialDocuments,
}: OperatorDocumentsViewProps) {
  const connectionState = useOperatorDocumentsSse();
  const [documents, setDocuments] = useState(initialDocuments);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);

  const refetchQueue = useCallback(async () => {
    setIsRefreshing(true);
    setRefreshError(null);

    try {
      const raw = await clientFetch<PendingDocumentsApiResponse>(
        "/operator/documents/pending",
      );
      setDocuments(adaptPendingDocuments(raw));
      setLastRefreshedAt(new Date().toISOString());
    } catch {
      setRefreshError("Failed to refresh document queue. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const handleReviewed = useCallback(
    () => {
      refetchQueue();
    },
    [refetchQueue],
  );

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-100 pb-5">
        <div className="flex items-center gap-2.5">
          <ClipboardCheck aria-hidden="true" className="h-5 w-5 text-neutral-700" />
          <h2 className="text-base font-bold uppercase tracking-wider text-neutral-900">
            Pending review queue
          </h2>
          {documents.length > 0 ? (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
              {documents.length}
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
              connectionState === "live"
                ? "border-green-200 bg-green-50 text-green-700"
                : connectionState === "fallback"
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-neutral-200 bg-neutral-50 text-neutral-600"
            }`}
          >
            {connectionState === "live"
              ? "Live"
              : connectionState === "fallback"
                ? "Polling"
                : "Reconnecting"}
          </span>

          {lastRefreshedAt ? (
            <span className="text-xs font-light text-neutral-400">
              Updated {formatOperatorTime(lastRefreshedAt)}
            </span>
          ) : null}

          <button
            type="button"
            onClick={refetchQueue}
            disabled={isRefreshing}
            aria-label="Refresh pending document queue"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 text-xs font-bold uppercase tracking-wider text-neutral-900 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50 disabled:opacity-50"
          >
            <RefreshCw
              aria-hidden="true"
              className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {refreshError ? (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-800"
        >
          <AlertTriangle aria-hidden="true" className="h-4 w-4 shrink-0" />
          {refreshError}
        </div>
      ) : null}

      {documents.length === 0 && !isRefreshing ? (
        <div className="flex flex-col items-center justify-center rounded-[1.25rem] border border-neutral-200 bg-white py-16 text-center shadow-sm">
          <ClipboardCheck
            aria-hidden="true"
            className="h-12 w-12 stroke-1 text-neutral-300"
          />
          <p className="mt-4 text-sm font-semibold text-neutral-900">
            No pending documents
          </p>
          <p className="mt-1 text-xs font-light text-neutral-500">
            All submitted documents have been reviewed.
          </p>
        </div>
      ) : null}

      {documents.length > 0 ? (
        <div
          className="space-y-5"
          aria-live="polite"
          aria-atomic="false"
          aria-label={`${documents.length} document${documents.length !== 1 ? "s" : ""} awaiting review`}
        >
          {documents.map((doc) => (
            <OperatorDocumentReviewCard
              key={doc.id}
              doc={doc}
              onReviewed={handleReviewed}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
