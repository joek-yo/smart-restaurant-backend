// src/modules/menu/dto/create-product.dto.ts

import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateProductDto {

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  category_id!: string;

  @IsNumber()
  price!: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsBoolean()
  is_available?: boolean;

  @IsOptional()
  @IsBoolean()
  is_out_of_stock?: boolean;

  @IsOptional()
  @IsNumber()
  sort_order?: number;
}