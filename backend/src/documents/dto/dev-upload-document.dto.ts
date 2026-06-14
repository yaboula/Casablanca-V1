import { IsBase64, IsEnum, IsString, IsUUID, Length } from 'class-validator';
import { DocumentType } from '../reservation-document.entity';

export class DevUploadDocumentDto {
  @IsUUID()
  reservationId: string;

  @IsEnum(DocumentType)
  type: DocumentType;

  @IsString()
  @Length(10, 500)
  fileKey: string;

  @IsString()
  @Length(3, 100)
  mimeType: string;

  @IsBase64()
  base64: string;
}
