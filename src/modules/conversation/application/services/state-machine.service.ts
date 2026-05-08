// src/modules/conversation/application/services/state-machine.service.ts

import { Injectable } from '@nestjs/common';

import { ConversationState } from '../../domain/enums/conversation-state.enum';
import { ConversationIntent } from '../../domain/enums/conversation-intent.enum';

@Injectable()
export class StateMachineService {

  /**
   * PURE FUNCTION:
   * (state + intent) => next state
   */
  transition(
    state: ConversationState,
    intent: ConversationIntent,
  ): ConversationState {

    switch (state) {

      case ConversationState.IDLE:
        if (intent === ConversationIntent.VIEW_PRODUCTS)
          return ConversationState.BROWSING;

        return ConversationState.IDLE;

      case ConversationState.BROWSING:
        if (intent === ConversationIntent.ADD_TO_CART)
          return ConversationState.CART_ACTIVE;

        return state;

      case ConversationState.CART_ACTIVE:
        if (intent === ConversationIntent.CHECKOUT)
          return ConversationState.CHECKOUT;

        return state;

      case ConversationState.CHECKOUT:
        return ConversationState.PAYMENT_PENDING;

      case ConversationState.PAYMENT_PENDING:
        return ConversationState.ORDER_CONFIRMED;

      default:
        return state;
    }
  }
}
