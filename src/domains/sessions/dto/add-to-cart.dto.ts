// src/domains/sessions/dto/add-to-cart.dto.ts
import { IsString, IsNotEmpty, IsNumber, Min, IsOptional, IsObject } from 'class-validator';

export class AddToCartDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string; // Added for WhatsApp/SMS identification

  @IsString()
  @IsNotEmpty()
  businessId!: string; // Multi-tenant support

  @IsString()
  @IsOptional()
  branchId?: string;   // Optional branch-level differentiation

  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsObject()
  options?: Record<string, any>; // e.g., size, toppings
}