import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsObject } from 'class-validator';

export class CreateRestaurantDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsString()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  logo_url?: string;

  @IsString()
  @IsNotEmpty()
  timezone!: string;

  @IsString()
  @IsNotEmpty()
  currency!: string;

  @IsObject()
  @IsOptional()
  business_hours?: {
    open: string;
    close: string;
  };

  @IsString()
  @IsOptional()
  subscription_plan?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}