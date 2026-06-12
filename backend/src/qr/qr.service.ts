import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface TicketTokenPayload {
  typ: 'reservation-ticket';
  reservationId: string;
  userId: string;
  ticketVersion: number;
  exp: number;
}

export interface IssuedTicketToken {
  ticketToken: string;
  expiresAt: string;
}

export interface TicketVerificationResult {
  valid: boolean;
  reason?: 'MALFORMED' | 'BAD_SIGNATURE' | 'EXPIRED' | 'WRONG_TYPE';
  payload?: TicketTokenPayload;
}

@Injectable()
export class QrService {
  private readonly secret: string;
  private readonly ticketTtlSeconds: number;

  constructor(private readonly config: ConfigService) {
    this.secret = this.config.get<string>('QR_SIGNING_SECRET')!;
    const configuredTtl = Number(
      this.config.get<string>('QR_TICKET_TTL_SECONDS', '86400'),
    );
    this.ticketTtlSeconds =
      Number.isFinite(configuredTtl) && configuredTtl > 0
        ? configuredTtl
        : 86400;
  }

  /**
   * Generates a deterministic HMAC-SHA256 hash for a reservation.
   * The hash encodes (reservationId + userId + pickupDate) so forgery
   * requires knowledge of the signing secret.
   *
   * Same inputs always produce exactly the same hash → idempotent.
   */
  generateHash(reservationId: string, userId: string, pickupDate: Date): string {
    const payload = `${reservationId}|${userId}|${pickupDate.toISOString()}`;
    return crypto
      .createHmac('sha256', this.secret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Verifies that a QR code hash matches the expected computed hash.
   * Uses timing-safe comparison to prevent timing attacks.
   */
  verifyHash(
    hash: string,
    reservationId: string,
    userId: string,
    pickupDate: Date,
  ): boolean {
    const expected = this.generateHash(reservationId, userId, pickupDate);
    try {
      return crypto.timingSafeEqual(
        Buffer.from(hash, 'hex'),
        Buffer.from(expected, 'hex'),
      );
    } catch {
      return false;
    }
  }

  issueTicketToken(input: {
    reservationId: string;
    userId: string;
    ticketVersion: number;
    expiresAt?: Date;
  }): IssuedTicketToken {
    const expiresAt =
      input.expiresAt ??
      new Date(Date.now() + this.ticketTtlSeconds * 1000);
    const payload: TicketTokenPayload = {
      typ: 'reservation-ticket',
      reservationId: input.reservationId,
      userId: input.userId,
      ticketVersion: input.ticketVersion,
      exp: Math.floor(expiresAt.getTime() / 1000),
    };
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    const signature = this.sign(encodedPayload);

    return {
      ticketToken: `${encodedPayload}.${signature}`,
      expiresAt: expiresAt.toISOString(),
    };
  }

  verifyTicketToken(ticketToken: string): TicketVerificationResult {
    const parts = ticketToken.split('.');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return { valid: false, reason: 'MALFORMED' };
    }

    const [encodedPayload, signature] = parts;
    const expectedSignature = this.sign(encodedPayload);
    if (!this.safeEqual(signature, expectedSignature)) {
      return { valid: false, reason: 'BAD_SIGNATURE' };
    }

    let payload: TicketTokenPayload;
    try {
      payload = JSON.parse(this.base64UrlDecode(encodedPayload));
    } catch {
      return { valid: false, reason: 'MALFORMED' };
    }

    if (payload.typ !== 'reservation-ticket') {
      return { valid: false, reason: 'WRONG_TYPE' };
    }

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      return { valid: false, reason: 'EXPIRED', payload };
    }

    return { valid: true, payload };
  }

  private sign(encodedPayload: string): string {
    return crypto
      .createHmac('sha256', this.secret)
      .update(encodedPayload)
      .digest('base64url');
  }

  private safeEqual(value: string, expected: string): boolean {
    try {
      return crypto.timingSafeEqual(
        Buffer.from(value),
        Buffer.from(expected),
      );
    } catch {
      return false;
    }
  }

  private base64UrlEncode(value: string): string {
    return Buffer.from(value, 'utf8').toString('base64url');
  }

  private base64UrlDecode(value: string): string {
    return Buffer.from(value, 'base64url').toString('utf8');
  }
}
