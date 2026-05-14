// src/modules/smartpage/application/ai/smartpage-personalization.service.ts

import { Injectable } from '@nestjs/common';
import { SmartpageStrategy } from './intent-to-smartpage.service';

/**
 * SmartpagePersonalizationService
 * ----------------------------------------------------
 * Applies PER-USER personalization rules on top of:
 * - strategy
 * - recommended blocks
 * - user context
 *
 * This is the FINAL intelligence layer before rendering.
 */

export interface PersonalizationContext {
  userId: string;
  tenantId: string;

  strategy: SmartpageStrategy;

  isReturningUser?: boolean;
  hasPurchaseHistory?: boolean;
  hasCart?: boolean;
  cartItemCount?: number;

  lastViewedCategory?: string;
  preferredCategories?: string[];

  location?: string;
  language?: string;

  abandonedCart?: boolean;
}

export interface PersonalizedDecision {
  /**
   * Blocks that should be boosted in priority
   */
  boostBlocks: string[];

  /**
   * Blocks that should be suppressed/hidden
   */
  suppressBlocks: string[];

  /**
   * Dynamic flags for rendering engine
   */
  flags: Record<string, any>;

  /**
   * Optional reasoning (debug/analytics)
   */
  reasoning?: string;
}

@Injectable()
export class SmartpageRecommendationService {
  /**
   * Applies user-level personalization decisions
   * on top of recommendation + strategy.
   */
  personalize(ctx: PersonalizationContext): PersonalizedDecision {
    const boostBlocks: string[] = [];
    const suppressBlocks: string[] = [];
    const flags: Record<string, any> = {};

    // ==================================================
    // 🛒 ABANDONED CART PERSONALIZATION
    // ==================================================
    if (ctx.abandonedCart || ctx.hasCart) {
      boostBlocks.push('CART', 'CHECKOUT');
      flags.showRecoveryBanner = true;
    }

    // ==================================================
    // 🔁 RETURNING USER PERSONALIZATION
    // ==================================================
    if (ctx.isReturningUser) {
      boostBlocks.push('RECOMMENDATION');
      flags.personalizedGreeting = true;
    } else {
      suppressBlocks.push('RECOMMENDATION');
    }

    // ==================================================
    // 📦 PURCHASE HISTORY PERSONALIZATION
    // ==================================================
    if (ctx.hasPurchaseHistory) {
      boostBlocks.push('RECOMMENDATION', 'PRODUCT');
      flags.showUpsell = true;
    }

    // ==================================================
    // 🧠 CATEGORY AFFINITY PERSONALIZATION
    // ==================================================
    if (ctx.preferredCategories?.length) {
      flags.preferredCategories = ctx.preferredCategories;

      if (ctx.strategy === 'PRODUCT_DISCOVERY') {
        boostBlocks.push('CATALOG');
      }
    }

    // ==================================================
    // 🌍 LOCATION-BASED PERSONALIZATION
    // ==================================================
    if (ctx.location) {
      flags.geoPersonalization = true;

      if (ctx.location.includes('city')) {
        boostBlocks.push('BANNER');
      }
    }

    // ==================================================
    // 🛍️ STRATEGY-SPECIFIC PERSONALIZATION
    // ==================================================
    switch (ctx.strategy) {
      case 'CHECKOUT_FOCUSED':
        boostBlocks.push('CHECKOUT');
        suppressBlocks.push('RECOMMENDATION');
        break;

      case 'PRODUCT_DISCOVERY':
        boostBlocks.push('CATALOG', 'HERO');
        break;

      case 'RECOMMENDATION_FEED':
        boostBlocks.push('RECOMMENDATION');
        break;
    }

    // ==================================================
    // 🧠 FINAL NORMALIZATION RULES
    // ==================================================
    // Prevent conflicting UI noise
    const uniqueBoost = [...new Set(boostBlocks)];
    const uniqueSuppress = [...new Set(suppressBlocks)];

    return {
      boostBlocks: uniqueBoost,
      suppressBlocks: uniqueSuppress,
      flags,
      reasoning: 'Personalization applied based on user behavior + strategy',
    };
  }
}