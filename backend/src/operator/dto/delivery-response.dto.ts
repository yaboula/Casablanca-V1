/**
 * B2.1 — Delivery Response DTOs
 *
 * Used with ClassSerializerInterceptor to control exactly what fields
 * are serialized to JSON in GET /operator/deliveries responses.
 * All properties must be decorated with @Expose().
 */
import { Expose, Type } from "class-transformer";
import { Reservation } from "../../reservations/reservation.entity";
import { Vehicle } from "../../vehicles/vehicle.entity";

export class DeliveryDocumentDto {
  @Expose()
  id: string;

  @Expose()
  type: "PASSPORT" | "DRIVING_LICENSE";

  @Expose()
  status: string;
}

export class DeliveryVehicleDto {
  @Expose()
  id: string;

  @Expose()
  brand: string;

  @Expose()
  model: string;

  @Expose()
  category: string;

  @Expose()
  licensePlate: string;

  @Expose()
  imageUrl: string | null;
}

export class DeliveryResponseDto {
  @Expose()
  id: string;

  @Expose()
  customerName: string;

  @Expose()
  customerPhone: string;

  @Expose()
  vehicleId: string;

  @Expose()
  @Type(() => DeliveryVehicleDto)
  vehicle: DeliveryVehicleDto;

  /** ISO8601 */
  @Expose()
  pickupDate: string;

  /** ISO8601 */
  @Expose()
  returnDate: string;

  @Expose()
  pickupLocation: string;

  @Expose()
  totalDays: number;

  @Expose()
  status: string;

  /** Balance due in EUR (mapped from cents on the server) */
  @Expose()
  balanceDueEUR: number;

  @Expose()
  @Type(() => DeliveryDocumentDto)
  documents: DeliveryDocumentDto[];
}

export class DeliveryActionResponseDto {
  @Expose()
  id: string;

  @Expose()
  status: string;

  @Expose()
  vehicleId: string;

  @Expose()
  @Type(() => DeliveryVehicleDto)
  vehicle: DeliveryVehicleDto | null;

  /** ISO8601 */
  @Expose()
  pickupDate: string;

  /** ISO8601 */
  @Expose()
  returnDate: string;

  @Expose()
  pickupLocation: string;
}

export function toDeliveryResponseDto(
  reservation: Reservation,
): DeliveryResponseDto {
  return {
    id: reservation.id,
    customerName: reservation.customerName ?? "",
    customerPhone: reservation.customerPhone ?? "",
    vehicleId: reservation.vehicleId,
    vehicle: toDeliveryVehicleDto(reservation.vehicle),
    pickupDate: toIsoString(reservation.pickupDate),
    returnDate: toIsoString(reservation.returnDate),
    pickupLocation: reservation.pickupLocation,
    totalDays: reservation.totalDays,
    status: reservation.status,
    balanceDueEUR:
      ((reservation.totalPriceEurCents ?? 0) -
        (reservation.depositEurCents ?? 0)) /
      100,
    documents: (reservation.documents ?? []).map((doc) => ({
      id: doc.id,
      type: doc.type,
      status: doc.status,
    })),
  };
}

export function toDeliveryActionResponseDto(
  reservation: Reservation,
): DeliveryActionResponseDto {
  return {
    id: reservation.id,
    status: reservation.status,
    vehicleId: reservation.vehicleId,
    vehicle: reservation.vehicle
      ? toDeliveryVehicleDto(reservation.vehicle)
      : null,
    pickupDate: toIsoString(reservation.pickupDate),
    returnDate: toIsoString(reservation.returnDate),
    pickupLocation: reservation.pickupLocation,
  };
}

function toDeliveryVehicleDto(vehicle: Vehicle): DeliveryVehicleDto {
  return {
    id: vehicle.id,
    brand: vehicle.brand,
    model: vehicle.model,
    category: vehicle.category,
    licensePlate: vehicle.licensePlate,
    imageUrl: vehicle.imageUrl ?? null,
  };
}

function toIsoString(value: Date): string {
  return new Date(value).toISOString();
}
