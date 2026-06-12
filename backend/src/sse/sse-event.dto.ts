import { DocumentStatus } from "../documents/reservation-document.entity";
import { ReservationStatus } from "../reservations/reservation.entity";

export type CustomerReservationEventType =
  | "reservation.document.updated"
  | "reservation.status.updated";

export type OperatorStreamEventType =
  | "operator.deliveries.invalidated"
  | "operator.documents.invalidated";

export type SseEventType =
  | "keepalive"
  | CustomerReservationEventType
  | OperatorStreamEventType;

export interface KeepaliveSseEventDto {
  type: "keepalive";
  updatedAt: string;
}

export interface CustomerReservationSseEventDto {
  type: CustomerReservationEventType;
  resourceId: string;
  status: DocumentStatus | ReservationStatus | "AWAITING_CAPTURE";
  updatedAt: string;
}

export interface OperatorInvalidationSseEventDto {
  type: OperatorStreamEventType;
  resourceId: string;
  updatedAt: string;
}

export type NormalizedSseEventDto =
  | KeepaliveSseEventDto
  | CustomerReservationSseEventDto
  | OperatorInvalidationSseEventDto;
