// src/domains/menu/dto/create-category.dto.ts
import { IsString, IsOptional, IsNumber, IsMongoId } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  name!: string;

  @IsMongoId({ message: 'businessId must be a valid MongoDB ObjectId' })
  businessId!: string; // consistent camelCase

  @IsOptional()
  @IsNumber()
  sortOrder?: number; // camelCase consistent
}