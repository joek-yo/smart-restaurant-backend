// src/modules/smartpage/presentation/dto/update-smartpage.dto.ts

import {
  IsOptional,
  IsString,
  IsArray,
  IsObject,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * UpdateSmartPageDto
 * -----------------------------------------------------
 * Admin/CMS contract for updating SmartPage definitions.
 *
 * IMPORTANT:
 * - This modifies the SmartPage aggregate
 * - Must go through validation + versioning system
 */
export class UpdateSmartPageDto {
  // =====================================================
  // 🧭 IDENTIFIERS
  // =====================================================

  @IsString()
  tenantId!: string;

  @IsString()
  pageId!: string;

  // =====================================================
  // 📄 PAGE METADATA UPDATES
  // =====================================================

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'DISABLED';

  // =====================================================
  // 🧱 BLOCK UPDATES
  // =====================================================

  /**
   * Full block replacement strategy.
   * (Safer than partial patching for visual pages)
   */
  @IsOptional()
  @IsArray()
  blocks?: SmartPageBlockUpdateDto[];

  // =====================================================
  // ⚙️ SETTINGS OVERRIDES
  // =====================================================

  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;

  // =====================================================
  // 🎯 FEATURE FLAGS
  // =====================================================

  @IsOptional()
  @IsObject()
  features?: Record<string, boolean>;

  // =====================================================
  // 🧪 EXPERIMENTATION
  // =====================================================

  @IsOptional()
  @IsString()
  abTestGroup?: string;

  // =====================================================
  // 🚦 PUBLISH CONTROL
  // =====================================================

  @IsOptional()
  @IsBoolean()
  publishImmediately?: boolean;
}

/**
 * SmartPageBlockUpdateDto
 * -----------------------------------------------------
 * Used for updating individual blocks inside SmartPage
 */
export class SmartPageBlockUpdateDto {
  @IsString()
  id!: string;

  @IsString()
  type!: string;

  @IsOptional()
  @IsObject()
  visibility?: Record<string, any>;

  @IsOptional()
  @IsObject()
  payload?: Record<string, any>;

  @IsOptional()
  @IsObject()
  styling?: Record<string, any>;

  @IsOptional()
  @IsNumber()
  priority?: number;
}