// ============================================================
// Domain types — mirrors of the RFC entities for the frontend
// ============================================================

export type ReservationStatus =
  | "PENDING_DEPOSIT"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type DocumentStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED";

export type VehicleCategory = "SEDAN" | "SUV" | "LUXURY" | "COMPACT";

export type UserRole = "USER" | "OPERATOR" | "ADMIN";

export type Currency = "EUR" | "MAD";

export type PickupLocation = "CMN_T1" | "CMN_T2";

// ── Vehicle ─────────────────────────────────────────────────

export interface Vehicle {
  id: string;
  model: string;
  brand: string;
  category: VehicleCategory;
  /** Always stored as EUR, display layer handles MAD conversion */
  pricePerDay: number;
  currency: "EUR";
  imageUrl: string;
  /** Additional photos for gallery (optional) */
  imageUrls?: string[];
  transmission: "AUTOMATIC" | "MANUAL";
  seats: number;
  luggageCount: number;
  /** e.g. ['SIM 5GB', 'Tag Jawaz', 'Seguro Todo Riesgo'] */
  features: string[];
  isAvailable: boolean;
}

// ── Reservation ─────────────────────────────────────────────

export interface Reservation {
  id: string;
  vehicleId: string;
  vehicle?: Vehicle;
  pickupDate: string; // ISO 8601
  returnDate: string; // ISO 8601
  pickupLocation: PickupLocation;
  totalDays: number;
  totalPriceEUR: number;
  depositPaidEUR: number; // Always 10 €
  balanceDueEUR: number; // totalPriceEUR - depositPaidEUR
  status: ReservationStatus;
  qrCodeHash: string | null;
  customerName?: string;
  customerPhone?: string;
}

// ── Document ────────────────────────────────────────────────

export interface ReservationDocument {
  id: string;
  userId: string;
  reservationId: string;
  type: "PASSPORT" | "DRIVING_LICENSE";
  fileUrl: string; // Presigned S3 URL
  status: DocumentStatus;
  rejectionReason?: string;
  reviewedAt?: string;
}

// ── User ────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  role: UserRole;
}

// ── Booking flow (UI state) ──────────────────────────────────

export interface BookingDraft {
  pickupDate: number | null; // epoch ms
  returnDate: number | null; // epoch ms
  pickupLocation: PickupLocation;
  selectedVehicleId: string | null;
  totalDays: number | null;
  totalPriceEUR: number | null;
}
