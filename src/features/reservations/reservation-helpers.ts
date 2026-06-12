import type { ReservationViewModel } from "./types";

export function canAccessCustomerTicket(
  reservation: Pick<ReservationViewModel, "status" | "depositStatus">,
): boolean {
  return (
    reservation.status === "CONFIRMED" &&
    reservation.depositStatus === "CAPTURED"
  );
}
