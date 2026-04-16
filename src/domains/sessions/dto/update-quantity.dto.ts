// src/domains/sessions/dto/update-quantity.dto.ts
import { IsString, IsNotEmpty, IsNumber, Min, IsOptional } from 'class-validator';

export class UpdateQuantityDto {
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

  @IsNumber()
  @Min(1)
  quantity!: number;
}