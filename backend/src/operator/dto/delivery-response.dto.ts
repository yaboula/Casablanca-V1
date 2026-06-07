/**
 * B2.1 — Delivery Response DTOs
 *
 * Used with ClassSerializerInterceptor to control exactly what fields
 * are serialized to JSON in GET /operator/deliveries responses.
 * All properties must be decorated with @Expose().
 */
import { Expose, Type } from "class-transformer";

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

  @Expose()
  qrCodeHash: string | null;

  /** Balance due in EUR (mapped from cents on the server) */
  @Expose()
  balanceDueEUR: number;

  @Expose()
  @Type(() => DeliveryDocumentDto)
  documents: DeliveryDocumentDto[];
}
