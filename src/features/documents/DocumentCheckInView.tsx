"use client";

/**
 * DocumentCheckInView — client component for the reservation check-in page.
 *
 * Receives initial server-fetched reservation and documents as props.
 * Handles re-fetching documents after each successful upload client-side
 * (individual document state updates locally after confirm).
 *
 * Architecture:
 * - Initial data is server-fetched in page.tsx (no loading spinner on first paint)
 * - Client re-fetches documents only after uploads (not on mount)
 * - No polling — backend push/SSE is Commit K
 *
 * Eligibility:
 * - Upload is allowed when reservation.status === PENDING_DEPOSIT or CONFIRMED
 *   (matches backend UPLOAD_ALLOWED_STATUSES)
 * - If reservation is in any other status, show an informational state
 */

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { DocumentUploadCard } from "./DocumentUploadCard";
import type { DocumentViewModel, DocumentType } from "./types";
import type { ReservationViewModel } from "@/features/reservations/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type DocumentCheckInViewProps = {
  reservation: ReservationViewModel;
  initialDocuments: DocumentViewModel[];
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const UPLOAD_ALLOWED_STATUSES: ReservationViewModel["status"][] = [
  "PENDING_DEPOSIT",
  "CONFIRMED",
];

const REQUIRED_DOCUMENT_TYPES: {
  type: DocumentType;
  label: string;
}[] = [
  { type: "PASSPORT", label: "Passport" },
  { type: "DRIVING_LICENSE", label: "Driving Licence" },
];

// ---------------------------------------------------------------------------
// DocumentCheckInView
// ---------------------------------------------------------------------------

export function DocumentCheckInView({
  reservation,
  initialDocuments,
}: DocumentCheckInViewProps) {
  // Local document state — updated after each successful upload
  const [documents, setDocuments] =
    useState<DocumentViewModel[]>(initialDocuments);

  const uploadAllowed = UPLOAD_ALLOWED_STATUSES.includes(reservation.status);

  // After a successful upload, update the specific document in local state
  const handleUploadSuccess = useCallback((updated: DocumentViewModel) => {
    setDocuments((prev) => {
      const exists = prev.find((d) => d.type === updated.type);
      if (exists) {
        return prev.map((d) => (d.type === updated.type ? updated : d));
      }
      return [...prev, updated];
    });
  }, []);

  // Check completeness — all required types submitted (PENDING_REVIEW or APPROVED)
  const isAllSubmitted = REQUIRED_DOCUMENT_TYPES.every(({ type }) => {
    const doc = documents.find((d) => d.type === type);
    return (
      doc?.status === "PENDING_REVIEW" || doc?.status === "APPROVED"
    );
  });

  const isAllApproved = REQUIRED_DOCUMENT_TYPES.every(({ type }) => {
    const doc = documents.find((d) => d.type === type);
    return doc?.status === "APPROVED";
  });

  const getDocumentForType = (type: DocumentType): DocumentViewModel | null =>
    documents.find((d) => d.type === type) ?? null;

  return (
    <article className="mx-auto w-full max-w-3xl px-6 py-10 md:py-14">
      {/* ------------------------------------------------------------------ */}
      {/* Page header                                                          */}
      {/* ------------------------------------------------------------------ */}
      <header className="mb-10">
        <div className="flex items-center gap-2">
          <ShieldCheck
            aria-hidden="true"
            className="h-6 w-6 text-[var(--nx-accent)]"
          />
          <span className="text-xs font-black uppercase tracking-[0.14em] text-neutral-500">
            Document check-in
          </span>
        </div>
        <h1 className="mt-3 text-4xl font-black text-neutral-950">
          Upload your documents
        </h1>
        <p className="mt-3 max-w-xl text-base leading-7 text-neutral-700">
          Upload your passport and driving licence for operator verification
          before pickup at Casablanca Mohammed V Airport (CMN).
        </p>
        <p className="mt-2 text-sm text-neutral-500">
          Reservation:{" "}
          <span className="font-mono text-neutral-950">{reservation.id}</span>
        </p>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Upload not allowed — status gate                                    */}
      {/* ------------------------------------------------------------------ */}
      {!uploadAllowed && (
        <div
          className="mb-8 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-5 py-4"
          role="status"
        >
          <AlertTriangle
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
          />
          <div>
            <p className="text-sm font-bold text-amber-900">
              Document upload unavailable
            </p>
            <p className="mt-1 text-sm text-amber-800">
              Documents can only be uploaded when your reservation status is{" "}
              <strong>Awaiting deposit</strong> or{" "}
              <strong>Confirmed</strong>. Current status:{" "}
              <strong>{reservation.status.replace(/_/g, " ")}</strong>.
            </p>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* All documents approved — ready for pickup                           */}
      {/* ------------------------------------------------------------------ */}
      {isAllApproved && (
        <div
          aria-live="polite"
          className="mb-8 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-5 py-4"
        >
          <CheckCircle2
            aria-hidden="true"
            className="mt-0.5 h-5 w-5 shrink-0 text-green-600"
          />
          <div>
            <p className="text-sm font-black text-green-950">
              All documents approved
            </p>
            <p className="mt-1 text-sm text-green-800">
              Your documents have been verified by an operator. Your reservation
              is ready for pickup at CMN.
            </p>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* All submitted (not yet approved) — waiting state                    */}
      {/* ------------------------------------------------------------------ */}
      {isAllSubmitted && !isAllApproved && (
        <div
          aria-live="polite"
          className="mb-8 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-5 py-4"
        >
          <FileText
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0 text-blue-600"
          />
          <div>
            <p className="text-sm font-black text-blue-950">
              Documents submitted — awaiting review
            </p>
            <p className="mt-1 text-sm text-blue-800">
              Both documents have been submitted. An operator will review them
              shortly. You can replace any document by uploading a new file.
            </p>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Document cards                                                       */}
      {/* ------------------------------------------------------------------ */}
      <div className="space-y-5">
        {REQUIRED_DOCUMENT_TYPES.map(({ type, label }) => (
          <DocumentUploadCard
            existingDocument={getDocumentForType(type)}
            key={type}
            label={label}
            onUploadSuccess={handleUploadSuccess}
            reservationId={reservation.id}
            type={type}
          />
        ))}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Navigation                                                           */}
      {/* ------------------------------------------------------------------ */}
      <div className="mt-10 flex flex-col items-start gap-4 border-t border-[var(--nx-line)] pt-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            className="text-sm font-bold text-neutral-950 underline decoration-neutral-400 underline-offset-2 hover:decoration-neutral-950"
            href={`/reservations/${reservation.id}/confirmed`}
          >
            ← Back to reservation
          </Link>
        </div>

        {/* CTA to waiting room — placeholder for Commit K */}
        {isAllSubmitted && (
          <div className="flex items-center gap-3">
            <div>
              <p className="text-xs font-bold text-neutral-950">
                Documents submitted
              </p>
              <p className="text-xs text-neutral-500">
                Operator review will be notified automatically.
              </p>
            </div>
            <ArrowRight
              aria-hidden="true"
              className="h-4 w-4 text-neutral-400"
            />
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Help text                                                            */}
      {/* ------------------------------------------------------------------ */}
      <aside className="mt-8 rounded-lg border border-[var(--nx-line)] bg-[var(--nx-bg-soft)] px-5 py-4">
        <h2 className="text-xs font-black uppercase tracking-[0.14em] text-neutral-500">
          Document requirements
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-neutral-700">
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-950" />
            Passport must be valid and clearly show your full name and photo.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-950" />
            Driving licence must be a valid, unexpired licence from your country.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-950" />
            Photos must be clear, flat, and fully visible — no glare or cut-off
            edges.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-950" />
            Accepted formats: JPEG, PNG, PDF. Maximum recommended size: 10 MB.
          </li>
        </ul>
      </aside>
    </article>
  );
}
