// 📁 src/application/menu/use-cases/dto/create-menu-item.dto.ts

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MenuItemStatus } from '@modules/menu/enums/menu-item-status.enum';
import { MenuOptionDto } from './menu-option.dto';

/**
 * DTO for creating a new MenuItem
 * Ensures strong validation and type safety
 */
export class CreateMenuItemDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuOptionDto)
  @IsOptional()
  options?: MenuOptionDto[];

  @IsOptional()
  status?: MenuItemStatus;
}