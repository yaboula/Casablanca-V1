/**
 * B2.3 — Hardened input DTOs for operator endpoints.
 * Added @IsNotEmpty(), @MinLength(), and @MaxLength() to prevent
 * empty-string bypasses and oversized payloads.
 */
import {
  IsBoolean,
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
} from "class-validator";

export class ScanQrDto {
  /** QR code hash — must be at least 10 chars (real hashes are 64+ chars). */
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  qrCodeHash: string;
}

export class RejectDocumentDto {
  /** Rejection reason must be meaningful (5–500 chars). */
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(500)
  reason: string;
}

export class ManualCheckinDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(500)
  reason: string;

  @IsBoolean()
  identityConfirmed: boolean;

  @IsBoolean()
  documentsConfirmed: boolean;
}
