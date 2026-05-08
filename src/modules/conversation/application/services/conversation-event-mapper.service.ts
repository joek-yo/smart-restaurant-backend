// src/modules/conversation/application/services/conversation-event-mapper.service.ts

import { Injectable } from '@nestjs/common';
import { ConversationIntent } from '../../domain/enums/conversation-intent.enum';
import { ConversationState } from '../../domain/enums/conversation-state.enum';

/**
 * DOMAIN EVENT MAPPER
 * --------------------
 * Converts:
 *   intent + state + transition
 * into
 *   domain events
 *
 * This keeps TransitionResolver CLEAN.
 */

@Injectable()
export class ConversationEventMapperService {

  map(params: {
    intent: ConversationIntent;
    currentState: ConversationState;
    nextState: ConversationState;
  }): string[] {

    const events: string[] = [];

    const { intent, nextState } = params;

    // =========================
    // INTENT-BASED EVENTS
    // =========================

    if (intent === ConversationIntent.ADD_TO_CART) {
      events.push('conversation.cart.updated');
    }

    if (intent === ConversationIntent.REMOVE_FROM_CART) {
      events.push('conversation.cart.updated');
    }

    if (intent === ConversationIntent.CHECKOUT) {
      events.push('conversation.checkout.started');
    }

    // =========================
    // STATE-BASED EVENTS
    // =========================

    if (nextState === ConversationState.CHECKOUT) {
      events.push('conversation.checkout.started');
    }

    if (nextState === ConversationState.ORDER_CONFIRMED) {
      events.push('order.create.requested');
    }

    return events;
  }
}
