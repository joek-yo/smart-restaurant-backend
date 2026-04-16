// 📁 src/application/menu/use-cases/dto/menu-option.dto.ts
import { IsString, IsNumber, IsOptional, Min, IsBoolean, IsInt } from 'class-validator';

export class MenuOptionDto {
  @IsString()
  name!: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  required?: boolean;

  @IsInt()
  @IsOptional()
  maxSelection?: number;
}