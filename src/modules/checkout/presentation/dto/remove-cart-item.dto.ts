// src/modules/checkout/presentation/dto/remove-cart-item.dto.ts

import { IsString } from 'class-validator';

/**
 * REMOVE CART ITEM DTO
 * --------------------
 */

export class RemoveCartItemDto {
  @IsString()
  productId: string;
}