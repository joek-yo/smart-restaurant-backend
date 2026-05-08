// src/modules/checkout/presentation/dto/update-cart-quantity.dto.ts

import { IsString, IsNumber, Min } from 'class-validator';

/**
 * UPDATE CART QUANTITY DTO
 * ------------------------
 */

export class UpdateCartQuantityDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}