import { Expose } from "class-transformer";
import { DepositStatus, Reservation } from "../reservation.entity";

export class PaymentIntentRecoveryResponseDto {
  @Expose()
  reservationId: string;

  @Expose()
  clientSecret: string;

  @Expose()
  depositEurCents: number;

  @Expose()
  totalDueNowEurCents: number;

  @Expose()
  currency: string;

  @Expose()
  depositPaymentStatus: DepositStatus;

  @Expose()
  expiresAt: string | null;
}

export function toPaymentIntentRecoveryResponseDto(
  reservation: Reservation,
): PaymentIntentRecoveryResponseDto {
  return {
    reservationId: reservation.id,
    clientSecret: reservation.stripeClientSecret!,
    depositEurCents: reservation.depositEurCents,
    totalDueNowEurCents: reservation.totalDueNowEurCents,
    currency: reservation.currency,
    depositPaymentStatus: reservation.depositStatus,
    expiresAt: null,
  };
}
