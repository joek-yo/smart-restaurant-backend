// 📁 src/domains/sessions/services/upsell-engine.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { Session } from '../entities/session.entity';
import { CartItem } from '../entities/cart-item.entity';

/**
 * Upsell Engine
 * مسؤول عن اقتراح إضافات / combos / upgrades
 */
@Injectable()
export class UpsellEngineService {
  private readonly logger = new Logger(UpsellEngineService.name);

  /**
   * Suggest upsells based on current cart
   */
  async suggestUpsells(session: Session): Promise<string[]> {
    this.logger.log(
      `[UPSELL] Generating suggestions → sessionId=${session.id}`,
    );

    const suggestions: string[] = [];

    const hasBurger = session.items.some((item) =>
      item.name?.toLowerCase().includes('burger'),
    );

    const hasFries = session.items.some((item) =>
      item.name?.toLowerCase().includes('fries'),
    );

    // 🔥 Simple rule-based upsell (MVP)
    if (hasBurger && !hasFries) {
      suggestions.push('Add fries for 100? 🍟');
    }

    // 🔥 Combo suggestion
    if (session.items.length >= 2) {
      suggestions.push('Upgrade to combo and save 10% 🔥');
    }

    return suggestions;
  }

  /**
   * Apply discount / promotion to session
   */
  async applyDiscount(session: Session): Promise<void> {
    this.logger.log(
      `[UPSELL] Applying discount → sessionId=${session.id}`,
    );

    // 🔥 Simple MVP logic
    if (session.items.length >= 3) {
      const discount = session.totalAmount * 0.1; // 10%
      session.totalAmount -= discount;

      this.logger.log(
        `[UPSELL] Discount applied: -${discount} → newTotal=${session.totalAmount}`,
      );
    }
  }

  /**
   * Hook for AI-based recommendations (future Layer 6)
   */
  async getAIRecommendations(
    session: Session,
  ): Promise<string[]> {
    this.logger.log(
      `[UPSELL][AI] Fetching AI recommendations → sessionId=${session.id}`,
    );

    // 🔌 Future: call AI adapter
    // return this.aiAdapter.getRecommendations(session);

    return [];
  }

  /**
   * Suggest next best action (NBA)
   */
  async nextBestAction(session: Session): Promise<string | null> {
    if (!session.items.length) {
      return 'Show menu';
    }

    if (session.items.length < 2) {
      return 'Suggest more items';
    }

    return 'Proceed to checkout';
  }
}