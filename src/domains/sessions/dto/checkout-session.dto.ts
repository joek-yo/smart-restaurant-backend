// src/domains/sessions/dto/checkout-session.dto.ts
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CheckoutSessionDto {
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
  phone!: string; // Required for GET /sessions/:phone route

  @IsOptional()
  @IsString()
  paymentMethod?: string; // e.g., card, wallet, cash
}