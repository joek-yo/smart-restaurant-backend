// src/modules/smartpage/presentation/dto/render-smartpage.dto.ts

import { IsOptional, IsString, IsObject } from 'class-validator';

/**
 * RenderSmartPageDto
 * -----------------------------------------------------
 * Contract for requesting a SmartPage render.
 *
 * This is the ONLY input surface for the SmartPage engine.
 */
export class RenderSmartPageDto {
  // =====================================================
  // 🧭 TENANT CONTEXT
  // =====================================================

  @IsString()
  tenantId!: string;

  // =====================================================
  // 👤 USER CONTEXT
  // =====================================================

  @IsString()
  userId!: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  // =====================================================
  // 📱 CHANNEL CONTEXT
  // =====================================================

  @IsOptional()
  @IsString()
  channel?: 'web' | 'whatsapp' | 'mobile' | 'api';

  // =====================================================
  // 🧠 OPTIONAL OVERRIDES
  // =====================================================

  /**
   * Optional page hint:
   * e.g. "home", "product", "checkout"
   */
  @IsOptional()
  @IsString()
  pageType?: string;

  /**
   * Optional conversation state snapshot
   * (used when SmartPage is driven by chat/AI)
   */
  @IsOptional()
  @IsObject()
  conversationState?: Record<string, any>;

  /**
   * Optional session/cart snapshot
   * (used for real-time cart-driven rendering)
   */
  @IsOptional()
  @IsObject()
  sessionState?: Record<string, any>;

  // =====================================================
  // 🎯 FEATURE FLAGS / EXPERIMENTATION
  // =====================================================

  @IsOptional()
  @IsObject()
  features?: Record<string, boolean>;

  @IsOptional()
  @IsString()
  abTestGroup?: string;

  // =====================================================
  // 🔍 DEBUG MODE
  // =====================================================

  @IsOptional()
  @IsString()
  debug?: 'true' | 'false';
}