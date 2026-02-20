import { IsEnum, IsUUID, IsString, MinLength } from 'class-validator';
import { DocumentType } from '../reservation-document.entity';

export class ConfirmDocumentDto {
  @IsString()
  @MinLength(10)
  fileKey: string;

  @IsUUID('4')
  reservationId: string;

  @IsEnum(DocumentType)
  type: DocumentType;
}
