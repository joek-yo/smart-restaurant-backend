// 📁 File: src/application/menu/use-cases/dto/update-menu-item.dto.ts

import { IsOptional, IsString, IsNumber, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { MenuItemStatus } from '../../../../domains/menu/enums/menu-item-status.enum';
import { MenuOptionDto } from './menu-option.dto'; // Optional nested DTO for options

export class UpdateMenuItemDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsEnum(MenuItemStatus)
  status?: MenuItemStatus;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuOptionDto)
  options?: MenuOptionDto[];
}