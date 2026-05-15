// FILE: src/modules/truth-engine/application/truth-computation.service.ts

import { Injectable } from '@nestjs/common';

import {
  TruthSnapshot,
  SessionTruth,
  ConversationTruth,
} from '../domain/truth.types';

/**
 * =====================================================
 * 🧠 TRUTH COMPUTATION SERVICE
 * =====================================================
 *
 * Purpose:
 * - Derive intelligence from normalized truth
 * - Compute business logic signals
 * - Produce AI-ready features
 *
 * RULES:
 * ❌ NO DB access
 * ❌ NO CACHE access
 * ❌ NO external services
 * ✅ PURE deterministic logic only
 * =====================================================
 */

@Injectable()
export class TruthComputationService {
  /**
   * =====================================================
   * 🚀 MAIN ENTRY
   * =====================================================
   */
  compute(snapshot: TruthSnapshot): TruthSnapshot['computed'] {
    const session = snapshot.session;
    const conversation = snapshot.conversation;

    return {
      // ==================================================
      // 🛒 CART INTELLIGENCE
      // ==================================================
      cartItemCount: this.getCartItemCount(session),
      cartTotal: this.getCartTotal(session),

      // ==================================================
      // 🧠 SESSION STATE INTELLIGENCE
      // ==================================================
      isCheckoutActive: this.isCheckoutActive(session),

      // ==================================================
      // 👤 USER INTELLIGENCE
      // ==================================================
      isReturningUser: this.isReturningUser(conversation),

      // ==================================================
      // 📊 ENGAGEMENT SCORE
      // ==================================================
      engagementScore: this.calculateEngagement(snapshot),

      // ==================================================
      // 🎯 INTENT SIGNALS
      // ==================================================
      intentSignals: this.extractIntentSignals(snapshot),
    };
  }

  /**
   * =====================================================
   * 🛒 CART LOGIC
   * =====================================================
   */
  private getCartItemCount(session?: SessionTruth | null): number {
    if (!session?.items) return 0;
    return session.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }

  private getCartTotal(session?: SessionTruth | null): number {
    if (!session?.items) return 0;

    return session.items.reduce((sum, item) => {
      const price = item.price || 0;
      const qty = item.quantity || 0;
      return sum + price * qty;
    }, 0);
  }

  /**
   * =====================================================
   * 🧾 SESSION STATE LOGIC
   * =====================================================
   */
  private isCheckoutActive(session?: SessionTruth | null): boolean {
    if (!session?.state) return false;
    return session.state.toLowerCase() === 'checkout';
  }

  /**
   * =====================================================
   * 👤 USER BEHAVIOR LOGIC
   * =====================================================
   */
  private isReturningUser(conversation?: ConversationTruth | null): boolean {
    if (!conversation?.memory) return false;

    // heuristic: any prior interaction signals return behavior
    return !!(
      conversation.memory.lastSessionId ||
      conversation.memory.orderHistory ||
      conversation.memory.visitsCount
    );
  }

  /**
   * =====================================================
   * 📊 ENGAGEMENT SCORE ENGINE
   * =====================================================
   */
  private calculateEngagement(snapshot: TruthSnapshot): number {
    let score = 0;

    const session = snapshot.session;
    const conversation = snapshot.conversation;

    // Cart activity
    if ((session?.items?.length ?? 0) > 0) score += 30;

    // Checkout intent
    if (session?.state === 'checkout') score += 40;

    // Conversation activity
    if (conversation?.state) score += 20;

    // Memory depth
    if (conversation?.memory && Object.keys(conversation.memory).length > 2) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  /**
   * =====================================================
   * 🎯 INTENT SIGNAL ENGINE
   * =====================================================
   */
  private extractIntentSignals(snapshot: TruthSnapshot): string[] {
    const signals: string[] = [];

    const session = snapshot.session;
    const conversation = snapshot.conversation;

    // CART INTENT
    if ((session?.items?.length ?? 0) > 0) {
      signals.push('CART_INTENT');
    }

    // PURCHASE INTENT
    if (session?.state?.toLowerCase() === 'checkout') {
      signals.push('PURCHASE_INTENT');
    }

    // BROWSING INTENT
    if (!session?.items?.length && conversation?.state === 'browsing') {
      signals.push('BROWSING_INTENT');
    }

    // RETURNING USER INTENT
    if (this.isReturningUser(conversation)) {
      signals.push('RETURNING_USER');
    }

    // HIGH VALUE USER
    const total = this.getCartTotal(session);
    if (total > 100) {
      signals.push('HIGH_VALUE_CART');
    }

    return signals;
  }
}