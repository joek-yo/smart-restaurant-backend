// src/modules/menu/dto/create-product.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {

  @ApiProperty({ description: 'Product name' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: 'Category ID of the product' })
  @IsString()
  category_id!: string;

  @ApiProperty({ description: 'Price of the product' })
  @IsNumber()
  price!: number;

  @ApiPropertyOptional({ description: 'Optional description of the product' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Optional image URL of the product' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ description: 'Is the product available?' })
  @IsOptional()
  @IsBoolean()
  is_available?: boolean;

  @ApiPropertyOptional({ description: 'Is the product out of stock?' })
  @IsOptional()
  @IsBoolean()
  is_out_of_stock?: boolean;

  @ApiPropertyOptional({ description: 'Sort order for product listing' })
  @IsOptional()
  @IsNumber()
  sort_order?: number;
}