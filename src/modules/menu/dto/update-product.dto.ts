// src/modules/menu/dto/update-product.dto.ts

import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  
  // ✅ Add stock support
  @ApiPropertyOptional({ description: 'Product stock quantity' })
  @IsOptional()
  @IsNumber()
  stock?: number;

  // ✅ Add out-of-stock flag
  @ApiPropertyOptional({ description: 'Is product out of stock' })
  @IsOptional()
  @IsBoolean()
  is_out_of_stock?: boolean;
}