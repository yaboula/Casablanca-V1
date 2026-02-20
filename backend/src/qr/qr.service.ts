import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class QrService {
  private readonly secret: string;

  constructor(private readonly config: ConfigService) {
    this.secret = this.config.get<string>('QR_SIGNING_SECRET')!;
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
}
