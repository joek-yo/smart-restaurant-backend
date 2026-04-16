// src/domains/sessions/dto/remove-from-cart.dto.ts
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class RemoveFromCartDto {
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
  phone!: string; // Required to identify session

  @IsString()
  @IsNotEmpty()
  productId!: string;
}