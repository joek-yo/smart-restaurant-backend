// src/modules/orders/dto/create-order.dto.ts
import {
  IsArray,
  IsString,
  IsNumber,
  IsOptional,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

/** Individual item in the order */
export class CreateOrderItemDto {
  @IsString()
  product_id!: string;

  @IsNumber()
  @Min(1)
  quantity!: number;
}

/** Order creation DTO */
export class CreateOrderDto {
  @IsString()
  customer_name!: string;

  @IsString()
  customer_phone!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}