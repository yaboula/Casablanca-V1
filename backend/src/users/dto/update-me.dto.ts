import { IsOptional, IsString, Matches } from 'class-validator';

export class UpdateMeDto {
  /** Only the phone field is editable by the user themselves. */
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9]{7,15}$/, {
    message: 'phone must be a valid phone number (7–15 digits, optional leading +)',
  })
  phone?: string;
}
