/**
 * B2.2 — Pending Document Response DTO
 *
 * Used with ClassSerializerInterceptor to serialize
 * GET /operator/documents/pending responses.
 */
import { Expose } from "class-transformer";

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
