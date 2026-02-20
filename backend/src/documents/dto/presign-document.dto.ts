import { IsEnum, IsUUID } from 'class-validator';
import { DocumentType } from '../reservation-document.entity';

export class PresignDocumentDto {
  @IsUUID('4', { message: 'reservationId debe ser un UUID válido.' })
  reservationId: string;

  @IsEnum(DocumentType, {
    message: `type debe ser PASSPORT o DRIVING_LICENSE`,
  })
  type: DocumentType;
}
