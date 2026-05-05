// src/modules/business/application/dto/create-business.dto.ts
import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  MinLength,
  Matches,
} from 'class-validator';

export class CreateBusinessDto {
  @IsString()
  name!: string;

  @IsString()
  phone!: string;

  @IsEmail()
  email!: string;

  // slug must be lowercase letters, numbers, hyphens only
  // e.g. "prime-deals-kenya" or "pdk"
  @IsString()
  @MinLength(2)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug can only contain lowercase letters, numbers, and hyphens',
  })
  slug!: string;

  @IsOptional()
  @IsString()
  domain?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsString()
  timezone!: string;

  @IsString()
  currency!: string;

  @IsOptional()
  operatingHours?: {
    open: string;
    close: string;
  };

  @IsOptional()
  @IsString()
  subscriptionPlan?: string;

  @IsOptional()
  storefront?: {
    tagline?: string;
    whatsapp?: string;
    banner?: string;
    drawerBanner?: string;
    defaultDeliveryFee?: number;
    freeDeliveryThreshold?: number;
    deliveryZones?: Array<{ name: string; fee: number; keywords: string[] }>;
    navigation?: Array<{ id: string; label: string; path: string }>;
    uiConfig?: Record<string, any>;
    trustItems?: string[];
  };
}