"use client";

/**
 * DocumentCheckInView — client component for the reservation check-in page.
 *
 * Receives initial server-fetched reservation and documents as props.
 * Handles re-fetching documents after each successful upload client-side
 * (individual document state updates locally after confirm).
 */

import { useState, useCallback } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { DocumentUploadCard } from "./DocumentUploadCard";
import type { DocumentViewModel, DocumentType } from "./types";
import type { ReservationViewModel } from "@/features/reservations/types";
import { JourneyShell } from "@/features/reservations/JourneyShell";

type DocumentCheckInViewProps = {
  reservation: ReservationViewModel;
  initialDocuments: DocumentViewModel[];
};

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

export function DocumentCheckInView({
  reservation,
  initialDocuments,
}: DocumentCheckInViewProps) {
  const [documents, setDocuments] =
    useState<DocumentViewModel[]>(initialDocuments);

  const uploadAllowed = UPLOAD_ALLOWED_STATUSES.includes(reservation.status);

  const handleUploadSuccess = useCallback((updated: DocumentViewModel) => {
    setDocuments((prev) => {
      const exists = prev.find((d) => d.type === updated.type);
      if (exists) {
        return prev.map((d) => (d.type === updated.type ? updated : d));
      }
      return [...prev, updated];
    });
  }, []);

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
    <JourneyShell
      currentStep="verify-docs"
      reservationId={reservation.id}
      vehicleId={reservation.vehicle?.id}
      heading="Upload your documents."
      subtitle="Upload your passport and driving licence for verification before pickup at Casablanca Mohammed V Airport (CMN)."
      prev={{ label: "Back to payment summary", href: `/reservations/${reservation.id}/confirmed` }}
      next={
        isAllSubmitted
          ? { label: "Track review status", href: `/reservations/${reservation.id}/waiting` }
          : undefined
      }
    >
      <div className="space-y-8">

      {/* Upload not allowed banner */}
      {!uploadAllowed && (
        <div
          className="flex items-start gap-3.5 rounded-2xl border border-amber-200 bg-amber-50/40 px-5 py-4 shadow-sm"
          role="status"
        >
          <AlertTriangle
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
          />
          <div>
            <p className="text-xs font-semibold text-amber-900">
              Document upload unavailable
            </p>
            <p className="mt-1 text-xs text-amber-700 leading-relaxed font-light">
              Documents can only be uploaded when your reservation status is{" "}
              <strong>Awaiting deposit</strong> or{" "}
              <strong>Confirmed</strong>. Current status:{" "}
              <strong className="capitalize">{reservation.status.replace(/_/g, " ").toLowerCase()}</strong>.
            </p>
          </div>
        </div>
      )}

      {/* All documents approved banner */}
      {isAllApproved && (
        <div
          aria-live="polite"
          className="flex items-start gap-3.5 rounded-2xl border border-green-200 bg-green-50/30 px-5 py-4 shadow-sm"
        >
          <CheckCircle2
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
          />
          <div>
            <p className="text-xs font-semibold text-emerald-950 font-display">
              All documents approved
            </p>
            <p className="mt-1 text-xs text-emerald-700 leading-relaxed font-light">
              Your documents have been verified by an operator. Your reservation is fully ready for key pickup at CMN.
            </p>
          </div>
        </div>
      )}

      {/* Submitted but awaiting review banner */}
      {isAllSubmitted && !isAllApproved && (
        <div
          aria-live="polite"
          className="flex items-start gap-3.5 rounded-2xl border border-blue-200 bg-blue-50/30 px-5 py-4 shadow-sm"
        >
          <FileText
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0 text-blue-500"
          />
          <div>
            <p className="text-xs font-semibold text-blue-950 font-display">
              Documents submitted — awaiting review
            </p>
            <p className="mt-1 text-xs text-blue-700 leading-relaxed font-light">
              Both documents have been submitted. An operator will review them shortly. You can upload a new file to replace them at any time.
            </p>
          </div>
        </div>
      )}

      {/* Document upload cards */}
      <div className="space-y-6">
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

      {/* Help Instructions */}
      <aside className="rounded-2xl border border-neutral-200 bg-[#FAFAFA] p-6 shadow-sm space-y-4">
        <h2 className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
          Document requirements
        </h2>
        <ul className="space-y-2.5 text-xs text-neutral-600 font-light">
          <li className="flex items-start gap-2.5">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-400" />
            Passport must be valid, legible, and clearly show your full name, photo, and dates.
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-400" />
            Driving license must be valid and unexpired. International licenses are accepted.
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-400" />
            Photos must be flat and fully visible — avoid glare, fingers blocking text, or cut edges.
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-400" />
            Accepted formats: JPEG, PNG, PDF. Maximum recommended size is 10 MB.
          </li>
        </ul>
      </aside>
      </div>
    </JourneyShell>
  );
}
