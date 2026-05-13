// src/modules/conversation/application/services/intent-classifier.service.ts

import { Injectable } from '@nestjs/common';

/**
 * IntentClassifierService
 * ------------------------
 * PURE NLP normalization layer
 *
 * Responsibility:
 * - normalize raw user text
 * - classify intent signals
 * - remove noise / aliases / variations
 *
 * NOT responsible for:
 * - business decisions
 * - state transitions
 * - session or checkout logic
 */
@Injectable()
export class IntentClassifierService {

  classify(rawMessage: string): string {
    const text = this.normalize(rawMessage);

    // =========================
    // CART INTENTS
    // =========================
    if (this.matches(text, ['add', 'add item', 'add to cart'])) {
      return 'ADD_TO_CART';
    }

    if (this.matches(text, ['remove', 'remove item', 'delete from cart'])) {
      return 'REMOVE_FROM_CART';
    }

    // =========================
    // CHECKOUT FLOW
    // =========================
    if (this.exact(text, ['checkout', 'check out'])) {
      return 'CHECKOUT';
    }

    if (this.exact(text, ['confirm', 'confirm order', 'place order'])) {
      return 'CONFIRM_ORDER';
    }

    if (this.exact(text, ['cancel', 'cancel order'])) {
      return 'CANCEL_ORDER';
    }

    // =========================
    // CART VIEW
    // =========================
    if (this.exact(text, ['cart', 'my cart', 'view cart', 'show cart'])) {
      return 'VIEW_CART';
    }

    // =========================
    // BROWSING
    // =========================
    if (
      this.exact(text, ['menu', 'products']) ||
      text.includes('what do you have') ||
      text.includes('what can i order')
    ) {
      return 'VIEW_PRODUCTS';
    }

    // =========================
    // HELP / SMALL TALK
    // =========================
    if (this.exact(text, ['help', 'hi', 'hello', 'hey'])) {
      return 'ASK_HELP';
    }

    // =========================
    // FALLBACK (IMPORTANT)
    // =========================
    return 'SMALL_TALK';
  }

  // ==================================================
  // 🔧 INTERNAL HELPERS (PURE STRING NORMALIZATION)
  // ==================================================

  private normalize(input: string): string {
    return input
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');
  }

  private exact(text: string, patterns: string[]): boolean {
    return patterns.includes(text);
  }

  private matches(text: string, patterns: string[]): boolean {
    return patterns.some((p) => text.startsWith(p));
  }
}