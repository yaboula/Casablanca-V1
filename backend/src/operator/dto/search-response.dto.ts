import { Expose, Type } from "class-transformer";
import { Reservation } from "../../reservations/reservation.entity";
import { DeliveryVehicleDto } from "./delivery-response.dto";

export class OperatorSearchResultDto {
  @Expose()
  id: string;

  @Expose()
  status: string;

  @Expose()
  customerName: string;

  @Expose()
  customerPhoneMasked: string | null;

  /** ISO8601 */
  @Expose()
  pickupDate: string;

  /** ISO8601 */
  @Expose()
  returnDate: string;

  @Expose()
  pickupLocation: string;

  @Expose()
  @Type(() => DeliveryVehicleDto)
  vehicle: DeliveryVehicleDto | null;

  /** ISO8601 */
  @Expose()
  createdAt: string;
}

export interface OperatorSearchResponseDto {
  data: OperatorSearchResultDto[];
  total: number;
  page: number;
  limit: number;
}

export function toOperatorSearchResultDto(
  reservation: Reservation,
): OperatorSearchResultDto {
  return {
    id: reservation.id,
    status: reservation.status,
    customerName: reservation.customerName ?? "",
    customerPhoneMasked: maskPhone(reservation.customerPhone),
    pickupDate: reservation.pickupDate.toISOString(),
    returnDate: reservation.returnDate.toISOString(),
    pickupLocation: reservation.pickupLocation,
    vehicle: reservation.vehicle
      ? {
          id: reservation.vehicle.id,
          brand: reservation.vehicle.brand,
          model: reservation.vehicle.model,
          category: reservation.vehicle.category,
          licensePlate: reservation.vehicle.licensePlate,
          imageUrl: reservation.vehicle.imageUrl ?? null,
        }
      : null,
    createdAt: reservation.createdAt.toISOString(),
  };
}

function maskPhone(phone: string | null): string | null {
  if (!phone) return null;

  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "****";

  return `****${digits.slice(-4)}`;
}
