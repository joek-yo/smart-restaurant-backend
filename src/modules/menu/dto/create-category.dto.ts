// src/modules/menu/dto/create-category.dto.ts
import { IsString, IsOptional, IsNumber, IsMongoId } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  name!: string;

  @IsMongoId() // Ensure valid MongoDB ObjectId
  restaurant_id!: string;

  @IsOptional()
  @IsNumber()
  sort_order?: number;
}