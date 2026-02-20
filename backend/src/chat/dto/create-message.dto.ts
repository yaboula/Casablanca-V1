import { IsString, IsUUID, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateMessageDto {
  /** Frontend-generated idempotency key — prevents duplicate messages on retry */
  @IsString()
  messageId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  text: string;

  @IsOptional()
  @IsUUID('4')
  reservationId?: string;
}
