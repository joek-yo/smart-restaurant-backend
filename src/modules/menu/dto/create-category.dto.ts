// src/modules/menu/dto/create-category.dto.ts
import { IsString, IsOptional, IsNumber, IsMongoId } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  name!: string;

  @IsMongoId() // This ensures the ID sent is a valid MongoDB ObjectId
  restaurant_id!: string;

  @IsOptional()
  @IsNumber()
  sort_order?: number;
}