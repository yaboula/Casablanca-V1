import { ReservationStatus } from './reservation.entity';

export const BLOCKING_RESERVATION_STATUSES: readonly ReservationStatus[] = [
  ReservationStatus.PENDING_DEPOSIT,
  ReservationStatus.AWAITING_CAPTURE,
  ReservationStatus.CONFIRMED,
  ReservationStatus.IN_PROGRESS,
];

const ALLOWED_RESERVATION_TRANSITIONS: Record<
  ReservationStatus,
  readonly ReservationStatus[]
> = {
  [ReservationStatus.PENDING_DEPOSIT]: [
    ReservationStatus.AWAITING_CAPTURE,
    ReservationStatus.CANCELLED,
  ],
  [ReservationStatus.AWAITING_CAPTURE]: [
    ReservationStatus.CONFIRMED,
    ReservationStatus.CANCELLED,
  ],
  [ReservationStatus.CONFIRMED]: [
    ReservationStatus.IN_PROGRESS,
    ReservationStatus.CANCELLED,
  ],
  [ReservationStatus.IN_PROGRESS]: [ReservationStatus.COMPLETED],
  [ReservationStatus.COMPLETED]: [],
  [ReservationStatus.CANCELLED]: [],
};

export function isReservationTransitionAllowed(
  current: ReservationStatus,
  next: ReservationStatus,
): boolean {
  return ALLOWED_RESERVATION_TRANSITIONS[current].includes(next);
}

export function getAllowedReservationTransitions(
  current: ReservationStatus,
): readonly ReservationStatus[] {
  return ALLOWED_RESERVATION_TRANSITIONS[current];
}
