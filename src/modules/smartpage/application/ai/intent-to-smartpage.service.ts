// src/modules/smartpage/application/ai/intent-to-smartpage.service.ts

import { Injectable } from '@nestjs/common';

/**
 * IntentToSmartpageService
 * ----------------------------------------------------
 * Maps conversational intent → SmartPage strategy.
 *
 * This is the ENTRY POINT from Conversation Engine
 * into SmartPage rendering system.
 *
 * It decides:
 * - what page type to show
 * - what rendering mode to activate
 */
export type SmartpageStrategy =
  | 'PRODUCT_DISCOVERY'
  | 'PRODUCT_DETAIL'
  | 'CART_OVERVIEW'
  | 'CHECKOUT_FOCUSED'
  | 'RECOMMENDATION_FEED'
  | 'HERO_BRANDED_HOME'
  | 'GENERIC_BROWSING';

export interface IntentToSmartpageInput {
  intent: string;
  message?: string;
  hasCart?: boolean;
  hasUserHistory?: boolean;
  isReturningUser?: boolean;
  isCheckoutIntent?: boolean;
}

@Injectable()
export class IntentToSmartpageService {
  /**
   * Core mapping function:
   * conversation intent → page strategy
   */
  map(input: IntentToSmartpageInput): SmartpageStrategy {
    const intent = input.intent?.toLowerCase();

    // ==================================================
    // 🛒 CHECKOUT INTENT (HIGHEST PRIORITY)
    // ==================================================
    if (
      intent.includes('checkout') ||
      input.isCheckoutIntent === true
    ) {
      return 'CHECKOUT_FOCUSED';
    }

    // ==================================================
    // 🛍️ CART INTENT
    // ==================================================
    if (intent.includes('cart') || intent.includes('my items')) {
      return 'CART_OVERVIEW';
    }

    // ==================================================
    // 👟 PRODUCT DISCOVERY INTENT
    // ==================================================
    if (
      intent.includes('buy') ||
      intent.includes('shop') ||
      intent.includes('shoes') ||
      intent.includes('products') ||
      intent.includes('i want')
    ) {
      return 'PRODUCT_DISCOVERY';
    }

    // ==================================================
    // 🔍 PRODUCT DETAIL INTENT
    // ==================================================
    if (intent.includes('show') && intent.includes('product')) {
      return 'PRODUCT_DETAIL';
    }

    // ==================================================
    // 🧠 RECOMMENDATION INTENT
    // ==================================================
    if (
      input.hasUserHistory ||
      intent.includes('recommend') ||
      intent.includes('suggest')
    ) {
      return 'RECOMMENDATION_FEED';
    }

    // ==================================================
    // 🏠 RETURNING USER EXPERIENCE
    // ==================================================
    if (input.isReturningUser) {
      return 'HERO_BRANDED_HOME';
    }

    // ==================================================
    // 🌐 DEFAULT FALLBACK
    // ==================================================
    return 'GENERIC_BROWSING';
  }
}