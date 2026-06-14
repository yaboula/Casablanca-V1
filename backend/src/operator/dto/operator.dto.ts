/**
 * B2.3 — Hardened input DTOs for operator endpoints.
 * Added @IsNotEmpty(), @MinLength(), and @MaxLength() to prevent
 * empty-string bypasses and oversized payloads.
 */
import {
  IsBoolean,
  IsEnum,
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
} from "class-validator";
import { DeskCollectionMethod } from "../../reservations/reservation.entity";

export class ScanQrDto {
  /** Signed backend-owned ticket token. */
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  ticketToken: string;
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

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(16)
  manualCode: string;

  @IsBoolean()
  identityConfirmed: boolean;

  @IsBoolean()
  documentsConfirmed: boolean;
}

export class ConfirmHandoffDto {
  @IsBoolean()
  identityConfirmed: boolean;

  @IsBoolean()
  documentsConfirmed: boolean;
}

export class RecordDeskCollectionDto {
  @IsEnum(DeskCollectionMethod)
  method: DeskCollectionMethod;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  receiptReference: string;
}
