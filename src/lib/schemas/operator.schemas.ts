/**
 * F2.1 — Runtime Zod schemas for operator API responses.
 *
 * These schemas validate the shape of data coming from the NestJS backend
 * at runtime, providing a typed safety net in addition to TypeScript's
 * compile-time checks. Use with safeFetch() from @/lib/safe-fetch.
 */
import { z } from "zod";

// ── Shared sub-schemas ────────────────────────────────────────

export const DocumentTypeSchema = z.enum(["PASSPORT", "DRIVING_LICENSE"]);

export const DocumentStatusSchema = z.enum([
  "PENDING_REVIEW",
  "APPROVED",
  "REJECTED",
]);

export const ReservationStatusSchema = z.enum([
  "PENDING_DEPOSIT",
  "AWAITING_CAPTURE",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);

// ── Operator Deliveries ───────────────────────────────────────

export const DeliveryDocumentSchema = z.object({
  id: z.string().uuid(),
  type: DocumentTypeSchema,
  status: DocumentStatusSchema,
});

export const DeliveryVehicleSchema = z.object({
  id: z.string().uuid(),
  brand: z.string(),
  model: z.string(),
  category: z.string(),
  licensePlate: z.string(),
  imageUrl: z.string().nullable().optional(),
});

export const OperatorDeliverySchema = z.object({
  id: z.string().uuid(),
  customerName: z.string(),
  customerPhone: z.string(),
  vehicleId: z.string().uuid(),
  vehicle: DeliveryVehicleSchema,
  pickupDate: z.string(),
  returnDate: z.string(),
  pickupLocation: z.string(),
  totalDays: z.number(),
  status: ReservationStatusSchema,
  qrCodeHash: z.string().nullable(),
  balanceDueEUR: z.number(),
  documents: z.array(DeliveryDocumentSchema),
});

/** Response wrapper for GET /operator/deliveries */
export const DeliveriesResponseSchema = z.object({
  data: z.array(OperatorDeliverySchema),
  total: z.number(),
});

// ── Pending Documents ─────────────────────────────────────────

export const PendingDocumentSchema = z.object({
  id: z.string().uuid(),
  type: DocumentTypeSchema,
  status: DocumentStatusSchema,
  fileUrl: z.string(),
  reservationId: z.string().uuid(),
  customerName: z.string(),
  uploadedAgo: z.string().optional(),
});

/** Response wrapper for GET /operator/documents/pending */
export const PendingDocumentsResponseSchema = z.object({
  data: z.array(PendingDocumentSchema),
  total: z.number(),
});

// ── Inferred TypeScript types (re-exported for convenience) ───

export type OperatorDeliveryFromSchema = z.infer<typeof OperatorDeliverySchema>;
export type PendingDocumentFromSchema = z.infer<typeof PendingDocumentSchema>;
