const clientSecrets = new Map<string, string>();

export function rememberPaymentClientSecret(
  reservationId: string,
  clientSecret: string | null,
): void {
  if (!clientSecret) {
    return;
  }

  clientSecrets.set(reservationId, clientSecret);
}

export function consumePaymentClientSecret(
  reservationId: string,
): string | null {
  const clientSecret = clientSecrets.get(reservationId) ?? null;

  if (clientSecret) {
    clientSecrets.delete(reservationId);
  }

  return clientSecret;
}
