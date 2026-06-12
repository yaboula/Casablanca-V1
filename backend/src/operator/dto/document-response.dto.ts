/**
 * B2.2 — Pending Document Response DTO
 *
 * Used with ClassSerializerInterceptor to serialize
 * GET /operator/documents/pending responses.
 */
import { Expose } from "class-transformer";
import { ReservationStatus } from "../../reservations/reservation.entity";
import {
  ReservationDocument,
  DocumentStatus,
  DocumentType,
} from "../../documents/reservation-document.entity";

export class PendingDocumentResponseDto {
  @Expose()
  id: string;

  @Expose()
  type: "PASSPORT" | "DRIVING_LICENSE";

  @Expose()
  status: string;

  @Expose()
  fileUrl: string;

  @Expose()
  reservationId: string;

  @Expose()
  customerName: string;

  /** Human-readable time since upload, e.g. "8 min" */
  @Expose()
  uploadedAgo?: string;
}

export class ReviewedDocumentResponseDto {
  @Expose()
  id: string;

  @Expose()
  type: DocumentType;

  @Expose()
  status: DocumentStatus;

  @Expose()
  reservationId: string;

  @Expose()
  rejectionReason: string | null;

  @Expose()
  reviewedAt: string | null;
}

export class DocumentReviewResultDto {
  @Expose()
  document: ReviewedDocumentResponseDto;

  @Expose()
  reservationStatus: ReservationStatus;
}

export function toPendingDocumentResponseDto(
  doc: ReservationDocument,
  fileUrl: string,
  customerName: string,
  uploadedAgo: string,
): PendingDocumentResponseDto {
  return {
    id: doc.id,
    type: doc.type,
    status: doc.status,
    fileUrl,
    reservationId: doc.reservationId,
    customerName,
    uploadedAgo,
  };
}

export function toReviewedDocumentResponseDto(
  doc: ReservationDocument,
): ReviewedDocumentResponseDto {
  return {
    id: doc.id,
    type: doc.type,
    status: doc.status,
    reservationId: doc.reservationId,
    rejectionReason: doc.rejectionReason ?? null,
    reviewedAt: doc.reviewedAt ? doc.reviewedAt.toISOString() : null,
  };
}
