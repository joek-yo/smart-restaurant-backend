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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Individual item in the order */
export class CreateOrderItemDto {
  @ApiProperty({ description: 'ID of the product being ordered' })
  @IsString()
  product_id!: string;

  @ApiProperty({ description: 'Quantity of the product', minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity!: number;
}

/** Order creation DTO */
export class CreateOrderDto {
  @ApiProperty({ description: 'Customer full name' })
  @IsString()
  customer_name!: string;

  @ApiProperty({ description: 'Customer phone number' })
  @IsString()
  customer_phone!: string;

  @ApiProperty({ type: [CreateOrderItemDto], description: 'List of order items' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @ApiPropertyOptional({ description: 'Additional notes for the order' })
  @IsOptional()
  @IsString()
  notes?: string;
}