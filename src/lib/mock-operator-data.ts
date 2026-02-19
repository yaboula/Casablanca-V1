import type { Reservation, ReservationDocument, Vehicle } from "@/types";
import { MOCK_VEHICLES } from "./mock-data";

// ============================================================
// Mock operator data — replaced by API calls when backend is ready
// ============================================================

/** Today's deliveries with different urgency levels */
export const MOCK_DELIVERIES: (Reservation & { vehicle: Vehicle; arrivalTime: string })[] = [
  {
    id: "CMN-2026-001",
    vehicleId: "v1",
    vehicle: MOCK_VEHICLES[0], // Audi A4
    pickupDate: new Date(Date.now() + 25 * 60_000).toISOString(), // 25 min from now
    returnDate: new Date(Date.now() + 5 * 86_400_000).toISOString(),
    pickupLocation: "CMN_T2",
    totalDays: 5,
    totalPriceEUR: 800,
    depositPaidEUR: 10,
    balanceDueEUR: 790,
    status: "CONFIRMED",
    qrCodeHash: "NEXUS-CMN-2026-001-v1-1708300000000",
    customerName: "Ahmed Benjelloun",
    customerPhone: "+212 6 12 34 56 78",
    arrivalTime: new Date(Date.now() + 25 * 60_000).toISOString(),
  },
  {
    id: "CMN-2026-002",
    vehicleId: "v2",
    vehicle: MOCK_VEHICLES[1], // Mercedes Clase C
    pickupDate: new Date(Date.now() + 90 * 60_000).toISOString(), // 1.5 hours
    returnDate: new Date(Date.now() + 3 * 86_400_000).toISOString(),
    pickupLocation: "CMN_T1",
    totalDays: 3,
    totalPriceEUR: 570,
    depositPaidEUR: 10,
    balanceDueEUR: 560,
    status: "CONFIRMED",
    qrCodeHash: "NEXUS-CMN-2026-002-v2-1708310000000",
    customerName: "Sophie Martin",
    customerPhone: "+33 6 78 90 12 34",
    arrivalTime: new Date(Date.now() + 90 * 60_000).toISOString(),
  },
  {
    id: "CMN-2026-003",
    vehicleId: "v4",
    vehicle: MOCK_VEHICLES[3], // BMW Serie 3
    pickupDate: new Date(Date.now() + 4 * 3_600_000).toISOString(), // 4 hours
    returnDate: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    pickupLocation: "CMN_T2",
    totalDays: 7,
    totalPriceEUR: 1540,
    depositPaidEUR: 10,
    balanceDueEUR: 1530,
    status: "CONFIRMED",
    qrCodeHash: null,
    customerName: "Mohammed Alami",
    customerPhone: "+212 6 55 44 33 22",
    arrivalTime: new Date(Date.now() + 4 * 3_600_000).toISOString(),
  },
  {
    id: "CMN-2026-004",
    vehicleId: "v3",
    vehicle: MOCK_VEHICLES[2], // Hyundai Tucson
    pickupDate: new Date(Date.now() + 6 * 3_600_000).toISOString(), // 6 hours
    returnDate: new Date(Date.now() + 2 * 86_400_000).toISOString(),
    pickupLocation: "CMN_T1",
    totalDays: 2,
    totalPriceEUR: 240,
    depositPaidEUR: 10,
    balanceDueEUR: 230,
    status: "CONFIRMED",
    qrCodeHash: "NEXUS-CMN-2026-004-v3-1708340000000",
    customerName: "Fatima Zahra",
    customerPhone: "+212 6 99 88 77 66",
    arrivalTime: new Date(Date.now() + 6 * 3_600_000).toISOString(),
  },
  {
    id: "CMN-2026-005",
    vehicleId: "v5",
    vehicle: MOCK_VEHICLES[4], // Renault Clio
    pickupDate: new Date(Date.now() + 15 * 60_000).toISOString(), // 15 min — URGENT!
    returnDate: new Date(Date.now() + 1 * 86_400_000).toISOString(),
    pickupLocation: "CMN_T2",
    totalDays: 1,
    totalPriceEUR: 65,
    depositPaidEUR: 10,
    balanceDueEUR: 55,
    status: "CONFIRMED",
    qrCodeHash: "NEXUS-CMN-2026-005-v5-1708295000000",
    customerName: "Pierre Dubois",
    customerPhone: "+33 7 11 22 33 44",
    arrivalTime: new Date(Date.now() + 15 * 60_000).toISOString(),
  },
  {
    id: "CMN-2026-006",
    vehicleId: "v6",
    vehicle: MOCK_VEHICLES[5], // Range Rover Evoque
    pickupDate: new Date(Date.now() + 3 * 3_600_000).toISOString(), // 3 hours
    returnDate: new Date(Date.now() + 10 * 86_400_000).toISOString(),
    pickupLocation: "CMN_T2",
    totalDays: 10,
    totalPriceEUR: 2500,
    depositPaidEUR: 10,
    balanceDueEUR: 2490,
    status: "CONFIRMED",
    qrCodeHash: "NEXUS-CMN-2026-006-v6-1708320000000",
    customerName: "Yassine El Idrissi",
    customerPhone: "+212 6 44 55 66 77",
    arrivalTime: new Date(Date.now() + 3 * 3_600_000).toISOString(),
  },
  {
    id: "CMN-2026-007",
    vehicleId: "v1",
    vehicle: MOCK_VEHICLES[0], // Audi A4 (second unit)
    pickupDate: new Date(Date.now() + 8 * 3_600_000).toISOString(), // 8 hours
    returnDate: new Date(Date.now() + 4 * 86_400_000).toISOString(),
    pickupLocation: "CMN_T1",
    totalDays: 4,
    totalPriceEUR: 640,
    depositPaidEUR: 10,
    balanceDueEUR: 630,
    status: "CONFIRMED",
    qrCodeHash: null,
    customerName: "Laura García",
    customerPhone: "+34 6 12 34 56 78",
    arrivalTime: new Date(Date.now() + 8 * 3_600_000).toISOString(),
  },
  {
    id: "CMN-2026-008",
    vehicleId: "v2",
    vehicle: MOCK_VEHICLES[1], // Mercedes
    pickupDate: new Date(Date.now() + 10 * 3_600_000).toISOString(), // 10 hours
    returnDate: new Date(Date.now() + 6 * 86_400_000).toISOString(),
    pickupLocation: "CMN_T2",
    totalDays: 6,
    totalPriceEUR: 1140,
    depositPaidEUR: 10,
    balanceDueEUR: 1130,
    status: "CONFIRMED",
    qrCodeHash: "NEXUS-CMN-2026-008-v2-1708360000000",
    customerName: "Hassan Benjelloun",
    customerPhone: "+212 6 22 33 44 55",
    arrivalTime: new Date(Date.now() + 10 * 3_600_000).toISOString(),
  },
];

/** Pending document reviews */
export const MOCK_PENDING_DOCS: (ReservationDocument & { customerName: string; uploadedAgo: string })[] = [
  {
    id: "doc-001",
    userId: "user-001",
    reservationId: "CMN-2026-001",
    type: "PASSPORT",
    fileUrl: "/images/vehicles/placeholder.svg",
    status: "PENDING_REVIEW",
    customerName: "Ahmed Benjelloun",
    uploadedAgo: "8 min",
  },
  {
    id: "doc-002",
    userId: "user-002",
    reservationId: "CMN-2026-002",
    type: "DRIVING_LICENSE",
    fileUrl: "/images/vehicles/placeholder.svg",
    status: "PENDING_REVIEW",
    customerName: "Sophie Martin",
    uploadedAgo: "23 min",
  },
  {
    id: "doc-003",
    userId: "user-003",
    reservationId: "CMN-2026-003",
    type: "PASSPORT",
    fileUrl: "/images/vehicles/placeholder.svg",
    status: "PENDING_REVIEW",
    customerName: "Mohammed Alami",
    uploadedAgo: "1 hora",
  },
];

// ── Helpers ──────────────────────────────────────────────────

/** Get urgency level and time left for a delivery */
export function getDeliveryUrgency(arrivalTime: string): {
  level: "CRITICAL" | "SOON" | "NORMAL";
  minutesLeft: number;
  label: string;
} {
  const diff = new Date(arrivalTime).getTime() - Date.now();
  const mins = Math.max(0, Math.floor(diff / 60_000));

  if (mins < 30) {
    return { level: "CRITICAL", minutesLeft: mins, label: `EN ${mins} MIN` };
  }
  if (mins < 120) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return {
      level: "SOON",
      minutesLeft: mins,
      label: h > 0 ? `EN ${h}h ${m}min` : `EN ${mins} MIN`,
    };
  }
  const h = Math.floor(mins / 60);
  return { level: "NORMAL", minutesLeft: mins, label: `EN ${h}h` };
}

/** Document status data for operator dashboard */
export function getDocStatusForDelivery(reservationId: string): {
  status: "APPROVED" | "PENDING_REVIEW" | "REJECTED";
  label: string;
} {
  // Mock: first 3 have pending docs, rest are approved
  const pendingIds = MOCK_PENDING_DOCS.map((d) => d.reservationId);
  if (pendingIds.includes(reservationId)) {
    return { status: "PENDING_REVIEW", label: "EN REVISIÓN" };
  }
  return { status: "APPROVED", label: "APROBADOS" };
}
