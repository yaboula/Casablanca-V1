/**
 * Operator feature types.
 *
 * All types derived from backend DTOs:
 *   - backend/src/operator/dto/delivery-response.dto.ts
 *   - backend/src/operator/dto/document-response.dto.ts
 *   - backend/src/operator/dto/operator.dto.ts
 *   - backend/src/operator/services/operator-delivery.service.ts (stats shape)
 *
 * No fake statuses. No local state transitions.
 * All mutations go through backend endpoints.
 */

// ---------------------------------------------------------------------------
// Delivery feature
// ---------------------------------------------------------------------------

export type DeliveryDocumentSummary = {
  id: string;
  type: "PASSPORT" | "DRIVING_LICENSE";
  status: string; // "PENDING_REVIEW" | "APPROVED" | "REJECTED"
  fileUrl: string | null;
  rejectionReason: string | null;
  uploadedAt: string | null;
};

export type DeliveryVehicle = {
  id: string;
  brand: string;
  model: string;
  category: string;
  licensePlate: string;
  imageUrl: string | null;
};

/**
 * Adapted view model for GET /operator/deliveries.
 * balanceDueEUR is already in EUR (backend converts from cents).
 */
export type DeliveryViewModel = {
  id: string;
  customerName: string;
  customerPhone: string;
  vehicleId: string;
  vehicle: DeliveryVehicle | null;
  pickupDate: string;
  returnDate: string;
  pickupLocation: string;
  totalDays: number;
  status: string;
  balanceDueEUR: number;
  depositStatus:
    | "PENDING"
    | "CAPTURE_QUEUED"
    | "CAPTURED"
    | "FAILED"
    | "CANCELLED";
  currency: string;
  deskCollectionStatus: "NOT_REQUIRED" | "PENDING" | "RECEIVED";
  deskCollectionMethod: "CASH" | "TPE" | "BANK_TRANSFER" | "OTHER" | null;
  deskCollectionReference: string | null;
  deskCollectionReceivedAmountEUR: number | null;
  deskCollectionReceivedAt: string | null;
  documents: DeliveryDocumentSummary[];
};

// ---------------------------------------------------------------------------
// Delivery stats
// ---------------------------------------------------------------------------

/**
 * Adapted view model for GET /operator/deliveries/stats.
 */
export type DeliveryStats = {
  date: string;
  total: number;
  pendingDeposit?: number;
  awaitingCapture?: number;
  confirmed: number;
  inProgress: number;
  completed: number;
  cancelled?: number;
};

// ---------------------------------------------------------------------------
// Pending document review
// ---------------------------------------------------------------------------

/**
 * Adapted view model for GET /operator/documents/pending.
 *
 * fileUrl: backend-generated S3 presigned read URL.
 * - MUST NOT be stored, logged, or cached beyond the request.
 * - Links expire (typically 5 min S3 TTL).
 * - Do not expose in logs, console.log, or persistent state.
 */
export type PendingDocumentViewModel = {
  id: string;
  type: "PASSPORT" | "DRIVING_LICENSE";
  status: string;
  /** Temporary S3 presigned read URL — expires. Never store or cache. */
  fileUrl: string;
  reservationId: string;
  customerName: string;
  uploadedAgo: string;
};

// ---------------------------------------------------------------------------
// API response shapes (raw, defensive)
// ---------------------------------------------------------------------------

export type DeliveryListApiResponse = {
  data?: unknown[];
  total?: number;
};

export type DeliveryStatsApiResponse = {
  data?: unknown;
};

export type PendingDocumentsApiResponse = {
  data?: unknown[];
  total?: number;
};

export type ApproveDocumentApiResponse = {
  document?: unknown;
  reservationStatus?: string;
};

export type RejectDocumentApiResponse = {
  data?: unknown;
};

export type DeliveryActionApiResponse = {
  data?: unknown;
  message?: string;
};

export type OperatorSseConnectionState =
  | "live"
  | "degraded"
  | "fallback"
  | "closed";

// ---------------------------------------------------------------------------
// Action state — for UI locking
// ---------------------------------------------------------------------------

export type DeliveryActionState =
  | "idle"
  | "scanning"
  | "checking_in"
  | "completing"
  | "success"
  | "error";

export type DocumentActionState =
  | "idle"
  | "approving"
  | "rejecting"
  | "success"
  | "error";
