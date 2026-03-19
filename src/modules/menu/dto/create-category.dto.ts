// src/modules/menu/dto/create-category.dto.ts
import { IsString, IsOptional, IsNumber, IsMongoId } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Name of the category' })
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'ID of the restaurant this category belongs to',
    example: '64f1d2a7c9e7a3b6e8d1f123',
  })
  @IsMongoId() // Ensure valid MongoDB ObjectId
  restaurant_id!: string;

  @ApiPropertyOptional({ description: 'Sort order for displaying categories', example: 1 })
  @IsOptional()
  @IsNumber()
  sort_order?: number;
}