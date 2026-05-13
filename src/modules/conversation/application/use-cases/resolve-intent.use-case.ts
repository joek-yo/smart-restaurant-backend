// src/modules/conversation/application/use-cases/resolve-intent.use-case.ts

import { Injectable } from '@nestjs/common';
import { ConversationIntent } from '../../domain/enums/conversation-intent.enum';

@Injectable()
export class ResolveIntentUseCase {

  execute(message: string): ConversationIntent {
    const text = message.toLowerCase().trim();

    // =========================
    // 🛒 CART ACTIONS
    // =========================
    if (text.startsWith('add')) return ConversationIntent.ADD_TO_CART;
    if (text.startsWith('remove')) return ConversationIntent.REMOVE_FROM_CART;

    // =========================
    // 💳 CHECKOUT FLOW
    // =========================
    if (text === 'checkout' || text === 'check out')
      return ConversationIntent.CHECKOUT;

    if (text === 'confirm order' || text === 'confirm')
      return ConversationIntent.CONFIRM_ORDER;

    if (text === 'cancel' || text === 'cancel order')
      return ConversationIntent.CANCEL_ORDER;

    // =========================
    // 🛒 CART VIEW
    // =========================
    if (
      text === 'cart' ||
      text === 'my cart' ||
      text === 'show cart' ||
      text === 'view cart'
    ) {
      return ConversationIntent.VIEW_CART;
    }

    // =========================
    // 🛍️ BROWSING
    // =========================
    if (
      text === 'menu' ||
      text === 'products' ||
      text === 'show menu' ||
      text.includes('what do you have') ||
      text.includes('what can i order')
    ) {
      return ConversationIntent.VIEW_PRODUCTS;
    }

    // =========================
    // 🙋 HELP
    // =========================
    if (
      text === 'help' ||
      text === 'hi' ||
      text === 'hello'
    ) {
      return ConversationIntent.ASK_HELP;
    }

    // =========================
    // 🧊 SAFE FALLBACK
    // =========================
    return ConversationIntent.SMALL_TALK;
  }
}