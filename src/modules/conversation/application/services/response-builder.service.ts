// src/modules/conversation/application/services/response-builder.service.ts

import { Injectable } from '@nestjs/common';

/**
 * ResponseBuilderService
 * ----------------------
 * Composable response generation layer.
 *
 * Responsibility:
 * - build user-facing messages
 * - combine intent + state context
 * - provide consistent UX language
 *
 * NOT responsible for:
 * - business logic
 * - session/cart mutation
 * - checkout/order decisions
 */
@Injectable()
export class ResponseBuilderService {

  build(input: {
    intent: string;
    state: string;
    metadata?: Record<string, any>;
  }): string {

    const { intent, state } = input;

    // =========================
    // LOCKED STATES (highest priority)
    // =========================
    if (this.isLocked(state)) {
      return this.lockedStateResponse(state);
    }

    // =========================
    // INTENT-BASED RESPONSES
    // =========================
    switch (intent) {

      case 'ADD_TO_CART':
        return '✅ Added to your cart. Type "cart" to review or "checkout" to continue.';

      case 'REMOVE_FROM_CART':
        return '🗑️ Item removed from your cart.';

      case 'VIEW_CART':
        return '🛒 Here is your cart. You can "checkout" or "add more items".';

      case 'VIEW_PRODUCTS':
        return '🛍️ Here is our menu. Type "add [item]" to select products.';

      case 'CHECKOUT':
        return '💳 You are now in checkout. Type "confirm" to place your order or "cancel" to stop.';

      case 'CONFIRM_ORDER':
        return '⏳ Processing your order... Please wait.';

      case 'CANCEL_ORDER':
        return '❌ Order cancelled. You can type "menu" to start again.';

      case 'ASK_HELP':
        return this.helpMessage();

      // =========================
      // FALLBACK INTENT
      // =========================
      default:
        return this.stateBasedFallback(state);
    }
  }

  // ==================================================
  // 🔒 LOCKED STATE RESPONSES
  // ==================================================

  private isLocked(state: string): boolean {
    return [
      'PAYMENT_PENDING',
      'ORDER_CONFIRMED',
    ].includes(state);
  }

  private lockedStateResponse(state: string): string {
    switch (state) {
      case 'PAYMENT_PENDING':
        return '⏳ Your order is being processed. Please wait or type "cancel".';

      case 'ORDER_CONFIRMED':
        return '🎉 Your order is confirmed! We will notify you when it is ready.';

      default:
        return '⏳ Please wait...';
    }
  }

  // ==================================================
  // 🧠 STATE FALLBACK RESPONSES
  // ==================================================

  private stateBasedFallback(state: string): string {
    switch (state) {
      case 'IDLE':
        return '👋 Welcome! Type "menu" to start browsing.';

      case 'BROWSING':
        return '🛍️ You are browsing. Type "add [item]" to add products.';

      case 'CART_ACTIVE':
        return '🛒 You have items in your cart. Type "checkout" to continue.';

      case 'CHECKOUT':
        return '💳 You are in checkout. Type "confirm" or "cancel".';

      case 'ABANDONED':
        return '👋 Welcome back! Your cart is waiting.';

      default:
        return '🤖 Type "help" for available options.';
    }
  }

  // ==================================================
  // 📘 HELP MESSAGE (STATIC UX CONTRACT)
  // ==================================================

  private helpMessage(): string {
    return [
      '👋 Here is what you can do:',
      '',
      '• "menu" — browse products',
      '• "add [item]" — add to cart',
      '• "cart" — view your cart',
      '• "checkout" — place order',
      '• "cancel" — cancel current action',
    ].join('\n');
  }
}