// src/domains/sessions/dto/reset-session.dto.ts
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ResetSessionDto {
  @IsString()
  @IsNotEmpty()
  businessId!: string; // Multi-tenant support

  @IsString()
  @IsOptional()
  branchId?: string;   // Optional branch-level differentiation

  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string; // Required for identifying the session
}