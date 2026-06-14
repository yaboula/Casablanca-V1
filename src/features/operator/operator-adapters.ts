/**
 * Operator adapters — maps raw backend responses to typed view models.
 *
 * All mapping is defensive: unknown fields default to safe values.
 * These adapters are the only place where unknown API shapes are trusted.
 */

import type {
  DeliveryViewModel,
  DeliveryVehicle,
  DeliveryDocumentSummary,
  DeliveryStats,
  PendingDocumentViewModel,
  DeliveryListApiResponse,
  DeliveryStatsApiResponse,
  PendingDocumentsApiResponse,
} from "./types";

// ---------------------------------------------------------------------------
// Delivery adapters
// ---------------------------------------------------------------------------

function adaptDeliveryVehicle(raw: unknown): DeliveryVehicle | null {
  if (!raw || typeof raw !== "object") return null;
  const v = raw as Record<string, unknown>;
  return {
    id: typeof v.id === "string" ? v.id : "",
    brand: typeof v.brand === "string" ? v.brand : "",
    model: typeof v.model === "string" ? v.model : "",
    category: typeof v.category === "string" ? v.category : "",
    licensePlate: typeof v.licensePlate === "string" ? v.licensePlate : "",
    imageUrl: typeof v.imageUrl === "string" ? v.imageUrl : null,
  };
}

function adaptDeliveryDocument(raw: unknown): DeliveryDocumentSummary | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;
  return {
    id: typeof d.id === "string" ? d.id : "",
    type:
      d.type === "PASSPORT" || d.type === "DRIVING_LICENSE"
        ? d.type
        : "PASSPORT",
    status: typeof d.status === "string" ? d.status : "PENDING_REVIEW",
    fileUrl: typeof d.fileUrl === "string" ? d.fileUrl : null,
    rejectionReason:
      typeof d.rejectionReason === "string" ? d.rejectionReason : null,
    uploadedAt: typeof d.uploadedAt === "string" ? d.uploadedAt : null,
  };
}

export function adaptDelivery(raw: unknown): DeliveryViewModel | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;
  const id = typeof d.id === "string" ? d.id : null;
  if (!id) return null;

  const documents = Array.isArray(d.documents)
    ? d.documents.map(adaptDeliveryDocument).filter(
        (x): x is DeliveryDocumentSummary => x !== null,
      )
    : [];

  return {
    id,
    customerName: typeof d.customerName === "string" ? d.customerName : "—",
    customerPhone: typeof d.customerPhone === "string" ? d.customerPhone : "—",
    vehicleId: typeof d.vehicleId === "string" ? d.vehicleId : "",
    vehicle: adaptDeliveryVehicle(d.vehicle),
    pickupDate: typeof d.pickupDate === "string" ? d.pickupDate : "",
    returnDate: typeof d.returnDate === "string" ? d.returnDate : "",
    pickupLocation:
      typeof d.pickupLocation === "string" ? d.pickupLocation : "CMN",
    totalDays: typeof d.totalDays === "number" ? d.totalDays : 0,
    status: typeof d.status === "string" ? d.status : "CONFIRMED",
    balanceDueEUR: typeof d.balanceDueEUR === "number" ? d.balanceDueEUR : 0,
    depositStatus:
      d.depositStatus === "PENDING" ||
      d.depositStatus === "CAPTURE_QUEUED" ||
      d.depositStatus === "CAPTURED" ||
      d.depositStatus === "FAILED" ||
      d.depositStatus === "CANCELLED"
        ? d.depositStatus
        : "PENDING",
    currency: typeof d.currency === "string" ? d.currency : "EUR",
    deskCollectionStatus:
      d.deskCollectionStatus === "NOT_REQUIRED" ||
      d.deskCollectionStatus === "PENDING" ||
      d.deskCollectionStatus === "RECEIVED"
        ? d.deskCollectionStatus
        : "PENDING",
    deskCollectionMethod:
      d.deskCollectionMethod === "CASH" ||
      d.deskCollectionMethod === "TPE" ||
      d.deskCollectionMethod === "BANK_TRANSFER" ||
      d.deskCollectionMethod === "OTHER"
        ? d.deskCollectionMethod
        : null,
    deskCollectionReference:
      typeof d.deskCollectionReference === "string"
        ? d.deskCollectionReference
        : null,
    deskCollectionReceivedAmountEUR:
      typeof d.deskCollectionReceivedAmountEUR === "number"
        ? d.deskCollectionReceivedAmountEUR
        : null,
    deskCollectionReceivedAt:
      typeof d.deskCollectionReceivedAt === "string"
        ? d.deskCollectionReceivedAt
        : null,
    documents,
  };
}

export function adaptDeliveries(
  raw: DeliveryListApiResponse,
): DeliveryViewModel[] {
  if (!Array.isArray(raw.data)) return [];
  return raw.data
    .map(adaptDelivery)
    .filter((d): d is DeliveryViewModel => d !== null);
}

// ---------------------------------------------------------------------------
// Stats adapter
// ---------------------------------------------------------------------------

export function adaptDeliveryStats(raw: DeliveryStatsApiResponse): DeliveryStats {
  const d = raw.data && typeof raw.data === "object"
    ? (raw.data as Record<string, unknown>)
    : {};
  return {
    date: typeof d.date === "string" ? d.date : "",
    total: typeof d.total === "number" ? d.total : 0,
    pendingDeposit:
      typeof d.pendingDeposit === "number" ? d.pendingDeposit : 0,
    awaitingCapture:
      typeof d.awaitingCapture === "number" ? d.awaitingCapture : 0,
    confirmed: typeof d.confirmed === "number" ? d.confirmed : 0,
    inProgress: typeof d.inProgress === "number" ? d.inProgress : 0,
    completed: typeof d.completed === "number" ? d.completed : 0,
    cancelled: typeof d.cancelled === "number" ? d.cancelled : 0,
  };
}

// ---------------------------------------------------------------------------
// Pending documents adapter
// ---------------------------------------------------------------------------

function adaptPendingDocument(raw: unknown): PendingDocumentViewModel | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;
  const id = typeof d.id === "string" ? d.id : null;
  const fileUrl = typeof d.fileUrl === "string" ? d.fileUrl : null;
  if (!id || !fileUrl) return null;

  return {
    id,
    type:
      d.type === "PASSPORT" || d.type === "DRIVING_LICENSE"
        ? d.type
        : "PASSPORT",
    status: typeof d.status === "string" ? d.status : "PENDING_REVIEW",
    fileUrl, // Transient presigned URL — do not store or cache
    reservationId:
      typeof d.reservationId === "string" ? d.reservationId : "",
    customerName:
      typeof d.customerName === "string" ? d.customerName : "Customer",
    uploadedAgo:
      typeof d.uploadedAgo === "string" ? d.uploadedAgo : "unknown",
  };
}

export function adaptPendingDocuments(
  raw: PendingDocumentsApiResponse,
): PendingDocumentViewModel[] {
  if (!Array.isArray(raw.data)) return [];
  return raw.data
    .map(adaptPendingDocument)
    .filter((d): d is PendingDocumentViewModel => d !== null);
}
