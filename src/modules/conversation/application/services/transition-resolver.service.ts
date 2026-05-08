// src/modules/conversation/application/services/transition-resolver.service.ts

import { Injectable } from '@nestjs/common';

import { ConversationIntent } from '../../domain/enums/conversation-intent.enum';
import { ConversationState } from '../../domain/enums/conversation-state.enum';

@Injectable()
export class TransitionResolverService {

  /**
   * This is where DOMAIN EVENTS get triggered
   * Orders / Sessions / Catalog will listen here
   */
  async resolve(params: {
    tenantId: string;
    userId: string;
    message: string;
    intent: ConversationIntent;
    currentState: ConversationState;
    nextState: ConversationState;
  }): Promise<{ responseMessage: string; events: string[] }> {

    const { intent, nextState } = params;

    const events: string[] = [];

    let responseMessage = '🤖 I did not understand that.';

    // =========================
    // INTENT HANDLING
    // =========================

    if (intent === ConversationIntent.VIEW_PRODUCTS) {
      responseMessage = '🛍️ Here are your products...';
    }

    if (intent === ConversationIntent.ADD_TO_CART) {
      responseMessage = '✅ Added to cart.';
      events.push('cart.item.added');
    }

    if (intent === ConversationIntent.VIEW_CART) {
      responseMessage = '🛒 Here is your cart.';
    }

    if (intent === ConversationIntent.CHECKOUT) {
      responseMessage = '💳 Proceeding to checkout...';
      events.push('checkout.initiated');
    }

    if (nextState === ConversationState.ORDER_CONFIRMED) {
      responseMessage = '🎉 Order confirmed!';
      events.push('order.create.requested');
    }

    return {
      responseMessage,
      events,
    };
  }
}
