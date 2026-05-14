// src/modules/smartpage/application/ai/smartpage-recommendation.service.ts

import { Injectable } from '@nestjs/common';
import { SmartpageStrategy } from './intent-to-smartpage.service';

/**
 * SmartpageRecommendationService
 * ----------------------------------------------------
 * Responsible for selecting the MOST relevant block types
 * for a given SmartPage strategy + user context.
 *
 * This is NOT rendering.
 * This is BLOCK SELECTION INTELLIGENCE.
 */

export type RecommendedBlockType =
  | 'HERO'
  | 'CATALOG'
  | 'PRODUCT'
  | 'CART'
  | 'CHECKOUT'
  | 'RECOMMENDATION'
  | 'BANNER'
  | 'TEXT';

export interface RecommendationContext {
  strategy: SmartpageStrategy;

  hasCart?: boolean;
  hasUserHistory?: boolean;
  isReturningUser?: boolean;
  isAbandonedCart?: boolean;
  isCheckoutActive?: boolean;
  hasRecommendations?: boolean;

  cartItemCount?: number;
}

export interface BlockRecommendation {
  blocks: RecommendedBlockType[];
  reasoning?: string;
}

@Injectable()
export class SmartpageRecommendationService {
  /**
   * Core decision engine:
   * Strategy + context → optimal blocks
   */
  recommend(ctx: RecommendationContext): BlockRecommendation {
    const blocks: RecommendedBlockType[] = [];

    // ==================================================
    // 🛍️ PRODUCT DISCOVERY STRATEGY
    // ==================================================
    if (ctx.strategy === 'PRODUCT_DISCOVERY') {
      blocks.push('HERO', 'CATALOG');

      if (ctx.hasUserHistory || ctx.isReturningUser) {
        blocks.push('RECOMMENDATION');
      }

      return {
        blocks,
        reasoning: 'Product discovery prioritizes catalog + optional personalization',
      };
    }

    // ==================================================
    // 👟 PRODUCT DETAIL STRATEGY
    // ==================================================
    if (ctx.strategy === 'PRODUCT_DETAIL') {
      blocks.push('PRODUCT');

      if (ctx.hasCart) {
        blocks.push('CART');
      }

      return {
        blocks,
        reasoning: 'Product detail focuses on single item with optional cart context',
      };
    }

    // ==================================================
    // 🛒 CART OVERVIEW STRATEGY
    // ==================================================
    if (ctx.strategy === 'CART_OVERVIEW') {
      blocks.push('CART', 'RECOMMENDATION');

      if (ctx.cartItemCount && ctx.cartItemCount > 2) {
        blocks.push('BANNER'); // urgency / promo banner
      }

      return {
        blocks,
        reasoning: 'Cart view enhances conversion with upsells and urgency',
      };
    }

    // ==================================================
    // 💳 CHECKOUT STRATEGY
    // ==================================================
    if (ctx.strategy === 'CHECKOUT_FOCUSED') {
      blocks.push('CHECKOUT');

      if (ctx.hasCart) {
        blocks.push('CART'); // summary side panel
      }

      return {
        blocks,
        reasoning: 'Checkout prioritizes conversion flow with cart confirmation',
      };
    }

    // ==================================================
    // 🔥 RECOMMENDATION FEED STRATEGY
    // ==================================================
    if (ctx.strategy === 'RECOMMENDATION_FEED') {
      blocks.push('RECOMMENDATION', 'CATALOG');

      if (ctx.hasUserHistory) {
        blocks.push('PRODUCT');
      }

      return {
        blocks,
        reasoning: 'Recommendation-first experience for personalized browsing',
      };
    }

    // ==================================================
    // 🏠 HERO HOME STRATEGY
    // ==================================================
    if (ctx.strategy === 'HERO_BRANDED_HOME') {
      blocks.push('HERO', 'CATALOG', 'RECOMMENDATION');

      return {
        blocks,
        reasoning: 'Branded home combines hero + catalog + personalization',
      };
    }

    // ==================================================
    // 🌐 GENERIC FALLBACK
    // ==================================================
    blocks.push('HERO', 'CATALOG');

    return {
      blocks,
      reasoning: 'Default fallback experience',
    };
  }
}