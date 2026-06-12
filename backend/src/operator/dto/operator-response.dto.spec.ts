import {
  PickupLocation,
  Reservation,
  ReservationStatus,
} from "../../reservations/reservation.entity";
import {
  DocumentStatus,
  DocumentType,
  ReservationDocument,
} from "../../documents/reservation-document.entity";
import {
  Vehicle,
  VehicleCategory,
  VehicleStatus,
  Transmission,
} from "../../vehicles/vehicle.entity";
import {
  toDeliveryActionResponseDto,
  toDeliveryResponseDto,
} from "./delivery-response.dto";
import { toReviewedDocumentResponseDto } from "./document-response.dto";
import { toOperatorSearchResultDto } from "./search-response.dto";

describe("operator response DTO mappers", () => {
  const vehicle = {
    id: "vehicle-1",
    brand: "Dacia",
    model: "Duster",
    category: VehicleCategory.SUV,
    licensePlate: "CMN-123",
    imageUrl: "https://cdn.example.com/duster.jpg",
    pricePerDayEurCents: 9000,
    imageUrls: ["https://cdn.example.com/extra.jpg"],
    features: ["GPS"],
    status: VehicleStatus.AVAILABLE,
    transmission: Transmission.AUTOMATIC,
    seats: 5,
    luggageCount: 2,
  } as Vehicle;

  const reservation = {
    id: "reservation-1",
    userId: "user-1",
    vehicleId: vehicle.id,
    vehicle,
    pickupDate: new Date("2026-02-19T10:00:00.000Z"),
    returnDate: new Date("2026-02-22T10:00:00.000Z"),
    totalDays: 3,
    totalPriceEurCents: 27000,
    depositEurCents: 1000,
    pickupLocation: PickupLocation.CMN_T1,
    status: ReservationStatus.CONFIRMED,
    stripePaymentIntentId: "pi_sensitive",
    stripeClientSecret: "pi_sensitive_secret",
    qrCodeHash: "qr-sensitive-hash",
    customerName: "Sara Client",
    customerPhone: "+212 612 345 678",
    createdAt: new Date("2026-02-18T10:00:00.000Z"),
    documents: [
      {
        id: "doc-1",
        userId: "user-1",
        reservationId: "reservation-1",
        type: DocumentType.PASSPORT,
        fileKey: "docs/user-1/passport.jpg",
        status: DocumentStatus.APPROVED,
      },
    ],
  } as Reservation;

  it("maps delivery rows without QR, payment, or full vehicle internals", () => {
    const dto = toDeliveryResponseDto(reservation);

    expect(dto).toMatchObject({
      id: reservation.id,
      customerName: "Sara Client",
      customerPhone: "+212 612 345 678",
      balanceDueEUR: 260,
      vehicle: {
        id: vehicle.id,
        brand: "Dacia",
        model: "Duster",
        licensePlate: "CMN-123",
      },
      documents: [
        {
          id: "doc-1",
          type: DocumentType.PASSPORT,
          status: DocumentStatus.APPROVED,
        },
      ],
    });

    const serialized = JSON.stringify(dto);
    expect(dto).not.toHaveProperty("qrCodeHash");
    expect(serialized).not.toContain("pi_sensitive");
    expect(serialized).not.toContain("qr-sensitive-hash");
    expect(serialized).not.toContain("pricePerDayEurCents");
    expect(serialized).not.toContain("fileKey");
    expect(serialized).not.toContain("userId");
  });

  it("maps check-in action responses without customer, QR, or payment data", () => {
    const dto = toDeliveryActionResponseDto(reservation);
    const serialized = JSON.stringify(dto);

    expect(dto).toMatchObject({
      id: reservation.id,
      status: ReservationStatus.CONFIRMED,
      vehicleId: vehicle.id,
      pickupLocation: PickupLocation.CMN_T1,
    });
    expect(serialized).not.toContain("Sara Client");
    expect(serialized).not.toContain("qr-sensitive-hash");
    expect(serialized).not.toContain("pi_sensitive");
  });

  it("maps search results with masked phone and no payment details", () => {
    const dto = toOperatorSearchResultDto(reservation);
    const serialized = JSON.stringify(dto);

    expect(dto.customerPhoneMasked).toBe("****5678");
    expect(serialized).not.toContain("+212 612 345 678");
    expect(serialized).not.toContain("pi_sensitive");
    expect(serialized).not.toContain("qr-sensitive-hash");
  });

  it("maps reviewed documents without S3 keys, user IDs, or reviewer IDs", () => {
    const doc = {
      id: "doc-1",
      userId: "user-1",
      reservationId: "reservation-1",
      type: DocumentType.PASSPORT,
      fileKey: "docs/user-1/passport.jpg",
      status: DocumentStatus.REJECTED,
      rejectionReason: "Blurred image",
      reviewedBy: "operator-1",
      reviewedAt: new Date("2026-02-19T11:00:00.000Z"),
    } as ReservationDocument;

    const dto = toReviewedDocumentResponseDto(doc);
    const serialized = JSON.stringify(dto);

    expect(dto).toEqual({
      id: "doc-1",
      type: DocumentType.PASSPORT,
      status: DocumentStatus.REJECTED,
      reservationId: "reservation-1",
      rejectionReason: "Blurred image",
      reviewedAt: "2026-02-19T11:00:00.000Z",
    });
    expect(serialized).not.toContain("fileKey");
    expect(serialized).not.toContain("user-1");
    expect(serialized).not.toContain("operator-1");
  });
});
