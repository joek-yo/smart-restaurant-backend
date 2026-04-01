// src/domains/menu/dto/create-product.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsMongoId,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  // ✅ Keep the new one
  @IsOptional()
  @IsMongoId({ message: 'categoryId must be a valid ObjectId' })
  categoryId?: string; 

  // ✅ Add the old one back temporarily to stop the 400 error
  @IsOptional()
  @IsMongoId({ message: 'category_id must be a valid ObjectId' })
  category_id?: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsBoolean()
  isOutOfStock?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number; 

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}