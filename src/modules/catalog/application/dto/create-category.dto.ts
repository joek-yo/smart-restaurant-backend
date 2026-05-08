// src/modules/catalog/application/dto/create-category.dto.ts
import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
