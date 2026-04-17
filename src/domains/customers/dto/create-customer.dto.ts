// src/domains/customers/dto/create-customer.dto.ts

import { IsNotEmpty, IsOptional, IsString, IsPhoneNumber } from 'class-validator';

/**
 * CreateCustomerDto
 * ------------------
 * Clean validated input for customer creation
 */
export class CreateCustomerDto {
  @IsNotEmpty()
  @IsString()
  businessId!: string;

  @IsNotEmpty()
  @IsString()
  phone!: string; // keep simple (avoid strict IsPhoneNumber unless you normalize format)

  @IsOptional()
  @IsString()
  name?: string;
}