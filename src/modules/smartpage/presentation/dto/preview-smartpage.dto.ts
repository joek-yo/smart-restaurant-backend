// src/modules/smartpage/presentation/dto/preview-smartpage.dto.ts

import { IsOptional, IsString, IsObject, IsBoolean } from 'class-validator';

/**
 * PreviewSmartPageDto
 * -----------------------------------------------------
 * Used by admins / internal tools to preview SmartPages
 * without affecting production state, caching, or analytics.
 */
export class PreviewSmartPageDto {
  // =====================================================
  // 🧭 TENANT CONTEXT
  // =====================================================

  @IsString()
  tenantId!: string;

  // =====================================================
  // 👤 USER CONTEXT (OPTIONAL OVERRIDE)
  // =====================================================

  @IsOptional()
  @IsString()
  userId?: string;

  // =====================================================
  // 📄 PAGE OVERRIDE
  // =====================================================

  /**
   * Force preview of a specific page
   */
  @IsOptional()
  @IsString()
  pageId?: string;

  /**
   * Force preview of a specific version (draft/published)
   */
  @IsOptional()
  @IsString()
  versionId?: string;

  // =====================================================
  // 📱 CHANNEL SIMULATION
  // =====================================================

  @IsOptional()
  @IsString()
  channel?: 'web' | 'whatsapp' | 'mobile' | 'api';

  // =====================================================
  // 🧠 STATE OVERRIDES (DEBUG SIMULATION)
  // =====================================================

  @IsOptional()
  @IsObject()
  conversationState?: Record<string, any>;

  @IsOptional()
  @IsObject()
  sessionState?: Record<string, any>;

  @IsOptional()
  @IsObject()
  userState?: Record<string, any>;

  // =====================================================
  // 🎯 FEATURE OVERRIDES
  // =====================================================

  @IsOptional()
  @IsObject()
  features?: Record<string, boolean>;

  @IsOptional()
  @IsString()
  abTestGroup?: string;

  // =====================================================
  // 🧪 DEBUG CONTROLS
  // =====================================================

  /**
   * If true:
   * - disables caching
   * - enables full logging
   * - bypasses personalization randomness
   */
  @IsOptional()
  @IsBoolean()
  debugMode?: boolean;

  /**
   * If true:
   * - forces all blocks visible
   * - ignores visibility engine
   */
  @IsOptional()
  @IsBoolean()
  forceAllBlocksVisible?: boolean;

  /**
   * If true:
   * - disables analytics tracking
   */
  @IsOptional()
  @IsBoolean()
  disableTracking?: boolean;
}