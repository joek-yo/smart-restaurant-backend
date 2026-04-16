// src/domains/sessions/dto/session-state.dto.ts
import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { SessionState } from '../value-objects/session-state.vo';

export class SessionStateDto {
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
  phone!: string; // Required for session identification

  @IsEnum(SessionState)
  @IsOptional()
  state?: SessionState;
}