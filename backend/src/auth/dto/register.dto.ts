import { IsEmail, IsString, MinLength, MaxLength, IsOptional, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Email inválido.' })
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  @MaxLength(72, { message: 'La contraseña no puede exceder 72 caracteres.' })
  password: string;

  @IsString()
  @MinLength(2, { message: 'El nombre es demasiado corto.' })
  @MaxLength(120)
  fullName: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9\s\-().]{7,30}$/, { message: 'Número de teléfono inválido.' })
  phone?: string;
}
