// src/domains/customers/dto/update-customer.dto.ts

import { IsOptional, IsString, IsArray } from 'class-validator';

/**
 * UpdateCustomerDto
 * ------------------
 * Transport contract for updating a customer
 */
export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];
}