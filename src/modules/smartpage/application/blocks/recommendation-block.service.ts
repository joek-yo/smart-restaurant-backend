// FILE: src/modules/smartpage/application/blocks/recommendation-block.service.ts

import { Injectable } from '@nestjs/common';

import { RenderContextVO } from '../../domain/value-objects/render-context.vo';
import { SmartPageBlockEntity } from '../../domain/entities/smartpage-block.entity';

/**
 * RecommendationBlockService
 * --------------------------
 * Renders AI-driven recommendation blocks.
 *
 * Responsibilities:
 * - Display personalized product recommendations
 * - Adjust based on user behavior signals
 * - Support fallback logic when recommendations are empty
 * - Prioritize contextual relevance (cart, browsing, history)
 */
@Injectable()
export class RecommendationBlockService {
  /**
   * Render a RECOMMENDATION block
   */
  render(
    block: SmartPageBlockEntity,
    context: RenderContextVO,
  ): Record<string, any> {
    const payload = block.payload ?? {};

    // ======================================================
    // 🧠 USER SIGNALS
    // ======================================================
    const isReturningUser = context?.user?.isReturning ?? false;
    const hasAbandonedCart = context?.cart?.hasItems ?? false;
    const hasHistory = context?.user?.history?.length > 0;

    // ======================================================
    // 📦 RAW RECOMMENDATIONS
    // ======================================================
    let recommendations = payload.recommendations ?? [];

    // ======================================================
    // 🎯 CONTEXTUAL BOOSTING
    // ======================================================
    if (hasAbandonedCart) {
      recommendations =
        payload.cartRecoveryRecommendations ?? recommendations;
    } else if (hasHistory) {
      recommendations =
        payload.historyBasedRecommendations ?? recommendations;
    } else if (isReturningUser) {
      recommendations =
        payload.returningUserRecommendations ?? recommendations;
    }

    // ======================================================
    // 🧹 FILTER INVALID ITEMS
    // ======================================================
    const validRecommendations = recommendations.filter((item: any) => {
      if (!item) return false;
      if (item.isAvailable === false) return false;
      if (item.isOutOfStock === true) return false;
      return true;
    });

    // ======================================================
    // 📦 EMPTY STATE
    // ======================================================
    if (!validRecommendations.length) {
      return {
        type: 'RECOMMENDATION',
        id: block.id,

        content: {
          title: payload.emptyTitle ?? 'Recommended for you',
          subtitle:
            payload.emptySubtitle ??
            'We’re still learning your preferences',
        },

        recommendations: [],

        metadata: {
          hasRecommendations: false,
          isReturningUser,
          hasAbandonedCart,
          hasHistory,
        },
      };
    }

    // ======================================================
    // 📦 FINAL OUTPUT
    // ======================================================
    return {
      type: 'RECOMMENDATION',
      id: block.id,

      content: {
        title: payload.title ?? 'Recommended for you',
        subtitle:
          payload.subtitle ??
          (hasAbandonedCart
            ? 'Complete your order with these picks'
            : 'Based on your activity'),
      },

      recommendations: validRecommendations,

      metadata: {
        count: validRecommendations.length,
        isReturningUser,
        hasAbandonedCart,
        hasHistory,
      },
    };
  }
}