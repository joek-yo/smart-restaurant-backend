// src/modules/sessions/dto/add-to-cart.dto.ts

import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class CartItemDto {
  @IsString()
  product_id!: string;

  @IsString()
  name!: string;

  @IsNumber()
  price!: number;

  @IsNumber()
  quantity!: number;

  @IsNumber()
  total!: number;
}

export class AddToCartDto {
  @IsString()
  @IsNotEmpty()
  phone!: string;

  item!: CartItemDto;
}