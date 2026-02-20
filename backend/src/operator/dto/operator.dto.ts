import { IsString, IsUUID } from 'class-validator';

export class ScanQrDto {
  @IsString()
  qrCodeHash: string;
}

export class RejectDocumentDto {
  @IsString()
  reason: string;
}
