// ============================================================
// Domain types — mirrors of the RFC entities for the frontend
// ============================================================

export type ReservationStatus =
  | "PENDING_DEPOSIT"
  | "AWAITING_CAPTURE"
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

// ── Operator types ───────────────────────────────────────────

export interface OperatorDocument {
  id: string;
  type: "PASSPORT" | "DRIVING_LICENSE";
  status: DocumentStatus;
  fileUrl?: string;
}

export interface OperatorDelivery {
  id: string;
  customerName: string;
  customerPhone: string;
  vehicleId: string;
  vehicle: Vehicle;
  /** ISO8601 — pickup time at the airport */
  pickupDate: string;
  returnDate: string;
  pickupLocation: PickupLocation;
  totalDays: number;
  status: ReservationStatus;
  /** Balance due in EUR (already mapped from cents on the server) */
  balanceDueEUR: number;
  documents: OperatorDocument[];
  qrCodeHash: string | null;
}

export interface PendingDocument {
  id: string;
  type: "PASSPORT" | "DRIVING_LICENSE";
  status: DocumentStatus;
  fileUrl: string;
  reservationId: string;
  customerName: string;
  /** Human-readable time since upload, e.g. "8 min" */
  uploadedAgo?: string;
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

// ── Admin types ──────────────────────────────────────────────

/** B2.4 — Mirrors backend AdminStats from admin-stats.service.ts */
export interface AdminStatsKpi {
  totalRevenueEurCents: number;
  totalBookings: number;
  activeUsers: number;
  activeVehicles: number;
}

export interface AdminStats {
  kpi: AdminStatsKpi;
  bookingsByStatus: Array<{ status: string; count: number }>;
  weeklyTrend: Array<{
    week: string;
    bookings: number;
    revenueEurCents: number;
  }>;
  topVehicles: Array<{
    id: string;
    brand: string;
    model: string;
    category: string;
    bookings: number;
  }>;
}
