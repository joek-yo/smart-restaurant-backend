// src/modules/auth/application/dto/register.dto.ts
import { IsEmail, IsString, MinLength, IsOptional, IsIn } from 'class-validator';

export class RegisterDto {
  @IsString()
  name!: string;

  @IsString()
  slug!: string;

  @IsEmail()
  email!: string;

  @IsString()
  phone!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  timezone!: string;

  @IsString()
  currency!: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsIn(['restaurant', 'retail', 'salon', 'pharmacy', 'grocery', 'gym', 'hotel', 'general'])
  businessType?: string;
}
