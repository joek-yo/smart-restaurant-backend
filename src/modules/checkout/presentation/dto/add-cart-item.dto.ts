// src/modules/checkout/presentation/dto/add-cart-item.dto.ts

import { IsString, IsNumber, Min } from 'class-validator';

/**
 * ADD CART ITEM DTO
 * ------------------
 * Input contract for adding items to cart
 */

export class AddCartItemDto {
  @IsString()
  productId: string;

  @IsString()
  name: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  price: number;
}