"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Loader2,
  XCircle,
} from "lucide-react";
import { clientFetch } from "@/lib/api/client-fetch";
import { normalizeApiError } from "@/lib/api/errors";
import { formatOperatorTime } from "./datetime";
import type { DeliveryDocumentSummary, DocumentActionState } from "./types";

type OperatorCaseDocumentsPanelProps = {
  documents: DeliveryDocumentSummary[];
  customerName: string;
};

function documentLabel(type: DeliveryDocumentSummary["type"]) {
  return type === "PASSPORT" ? "Passport" : "Driving licence";
}

function documentStatusTone(status: string) {
  if (status === "APPROVED") {
    return "border-green-200 bg-green-50 text-green-700";
  }
  if (status === "REJECTED") {
    return "border-red-200 bg-red-50 text-red-700";
  }
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function renderDocumentStatusIcon(status: string) {
  if (status === "APPROVED") {
    return <CheckCircle2 aria-hidden="true" className="h-3 w-3" />;
  }
  if (status === "REJECTED") {
    return <AlertTriangle aria-hidden="true" className="h-3 w-3" />;
  }
  return <Clock aria-hidden="true" className="h-3 w-3" />;
}

function DocumentCaseCard({
  doc,
  customerName,
}: {
  doc: DeliveryDocumentSummary;
  customerName: string;
}) {
  const router = useRouter();
  const reasonId = useId();
  const [actionState, setActionState] = useState<DocumentActionState>("idle");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [previewUnavailable, setPreviewUnavailable] = useState(!doc.fileUrl);

  const isBusy = actionState === "approving" || actionState === "rejecting";
  const label = documentLabel(doc.type);
  const canReview = doc.status === "PENDING_REVIEW";
  const reasonTooShort = reason.trim().length < 5;

  async function approveDocument() {
    setActionState("approving");
    setMessage(null);
    setShowRejectForm(false);

    try {
      await clientFetch(`/operator/documents/${doc.id}/approve`, {
        method: "PATCH",
      });
      setActionState("success");
      router.refresh();
    } catch (error) {
      const normalized = normalizeApiError(error);
      setActionState("error");
      setMessage(normalized.message || "Could not approve this document.");
    }
  }

  async function rejectDocument() {
    const trimmed = reason.trim();
    if (trimmed.length < 5) return;

    setActionState("rejecting");
    setMessage(null);

    try {
      await clientFetch(`/operator/documents/${doc.id}/reject`, {
        method: "PATCH",
        body: { reason: trimmed },
      });
      setActionState("success");
      setReason("");
      setShowRejectForm(false);
      router.refresh();
    } catch (error) {
      const normalized = normalizeApiError(error);
      setActionState("error");
      setMessage(normalized.message || "Could not reject this document.");
    }
  }

  return (
    <article className="rounded-2xl border border-neutral-200 bg-white">
      <div className="grid gap-4 p-4 sm:grid-cols-[132px_1fr]">
        <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
          {doc.fileUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={doc.fileUrl}
              alt={`${label} preview for ${customerName}`}
              className="h-full w-full object-contain p-2"
              onError={() => {
                setPreviewUnavailable(true);
              }}
            />
          ) : null}
          <div
            className={`${previewUnavailable ? "flex" : "hidden"} absolute inset-0 flex-col items-center justify-center gap-2 px-3 text-center text-neutral-400`}
          >
            <FileText aria-hidden="true" className="h-8 w-8 stroke-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Preview unavailable
            </span>
            <span className="text-[11px] leading-relaxed text-neutral-500">
              Open secure document
            </span>
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-neutral-950">{label}</h3>
              <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                {doc.uploadedAt
                  ? `Uploaded ${formatOperatorTime(doc.uploadedAt)}`
                  : "Upload time unavailable"}
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${documentStatusTone(doc.status)}`}
            >
              {renderDocumentStatusIcon(doc.status)}
              {doc.status.replace("_", " ")}
            </span>
          </div>

          {doc.rejectionReason ? (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-800">
              {doc.rejectionReason}
            </div>
          ) : null}

          {message ? (
            <div
              role="alert"
              className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800"
            >
              {message}
            </div>
          ) : null}

          {showRejectForm ? (
            <div className="mt-4 space-y-3">
              <label
                htmlFor={reasonId}
                className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500"
              >
                Rejection reason
              </label>
              <textarea
                id={reasonId}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                disabled={isBusy}
                rows={3}
                maxLength={500}
                className="w-full resize-none rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-950 outline-none transition focus:border-neutral-950 disabled:opacity-50"
                placeholder="Explain exactly what the customer must re-upload."
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={rejectDocument}
                  disabled={isBusy || reasonTooShort}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md bg-red-600 px-4 text-xs font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
                >
                  {actionState === "rejecting" ? (
                    <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <XCircle aria-hidden="true" className="h-3.5 w-3.5" />
                  )}
                  Reject document
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectForm(false);
                    setReason("");
                  }}
                  disabled={isBusy}
                  className="inline-flex h-9 items-center rounded-md border border-neutral-200 bg-white px-4 text-xs font-bold text-neutral-800 transition hover:bg-neutral-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {doc.fileUrl ? (
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-4 text-xs font-black text-neutral-900 transition hover:bg-neutral-50"
                >
                  <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
                  Open document
                </a>
              ) : null}

              {canReview ? (
                <>
                  <button
                    type="button"
                    onClick={approveDocument}
                    disabled={isBusy}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-xs font-black text-white transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {actionState === "approving" ? (
                      <Loader2
                        aria-hidden="true"
                        className="h-3.5 w-3.5 animate-spin"
                      />
                    ) : (
                      <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />
                    )}
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRejectForm(true)}
                    disabled={isBusy}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-red-200 bg-white px-4 text-xs font-black text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    <XCircle aria-hidden="true" className="h-3.5 w-3.5" />
                    Reject
                  </button>
                </>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export function OperatorCaseDocumentsPanel({
  documents,
  customerName,
}: OperatorCaseDocumentsPanelProps) {
  const approved = documents.filter((doc) => doc.status === "APPROVED").length;
  const pending = documents.filter((doc) => doc.status === "PENDING_REVIEW").length;
  const rejected = documents.filter((doc) => doc.status === "REJECTED").length;

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_18px_70px_rgba(15,23,42,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-100 pb-4">
        <div>
          <h2 className="text-sm font-black text-neutral-950">
            Document verification
          </h2>
          <p className="mt-1 text-xs text-neutral-500">
            Verify documents from this reservation case before vehicle release.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
          <span className="rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-green-700">
            {approved} approved
          </span>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-amber-700">
            {pending} pending
          </span>
          {rejected > 0 ? (
            <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-red-700">
              {rejected} rejected
            </span>
          ) : null}
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="flex items-center gap-3 py-6 text-sm text-neutral-500">
          <FileText aria-hidden="true" className="h-5 w-5 text-neutral-400" />
          No documents uploaded for this reservation yet.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {documents.map((doc) => (
            <DocumentCaseCard
              key={doc.id}
              doc={doc}
              customerName={customerName}
            />
          ))}
        </div>
      )}
    </section>
  );
}
