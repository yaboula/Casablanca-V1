import { IsEnum, IsIn, IsOptional, IsUUID } from 'class-validator';
import { DocumentType } from '../reservation-document.entity';

/** Allowed MIME types for document uploads */
export const ALLOWED_DOCUMENT_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'application/pdf',
] as const;

export type DocumentMimeType = (typeof ALLOWED_DOCUMENT_MIME_TYPES)[number];

export class PresignDocumentDto {
  @IsUUID('4', { message: 'reservationId debe ser un UUID válido.' })
  reservationId: string;

  @IsEnum(DocumentType, {
    message: `type debe ser PASSPORT o DRIVING_LICENSE`,
  })
  type: DocumentType;

  /**
   * MIME type of the file to be uploaded.
   * Defaults to 'image/jpeg' if omitted (backward compatibility).
   */
  @IsOptional()
  @IsIn(ALLOWED_DOCUMENT_MIME_TYPES, {
    message: `mimeType debe ser image/jpeg, image/png o application/pdf`,
  })
  mimeType?: DocumentMimeType;
}
