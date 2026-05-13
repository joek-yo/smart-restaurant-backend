// src/modules/conversation/application/policies/transition-guard.policy.ts

import { Injectable } from '@nestjs/common';
import { ConversationState } from '../../domain/enums/conversation-state.enum';

type TransitionMap = Record<ConversationState, ConversationState[]>;

@Injectable()
export class TransitionGuardPolicy {
  private readonly transitions: TransitionMap = {
    [ConversationState.IDLE]: [
      ConversationState.STARTED,
      ConversationState.BROWSING,
      ConversationState.CART_ACTIVE,
    ],

    [ConversationState.STARTED]: [
      ConversationState.BROWSING,
      ConversationState.IDLE,
    ],

    [ConversationState.BROWSING]: [
      ConversationState.VIEWING_PRODUCT,
      ConversationState.CART_ACTIVE,
      ConversationState.IDLE,
    ],

    [ConversationState.VIEWING_PRODUCT]: [
      ConversationState.BROWSING,
      ConversationState.CART_ACTIVE,
      ConversationState.CART_UPDATED,
    ],

    [ConversationState.CART_ACTIVE]: [
      ConversationState.BROWSING,
      ConversationState.CART_UPDATED,
      ConversationState.CHECKOUT,
      ConversationState.CHECKOUT_STARTED,
      ConversationState.IDLE,
    ],

    [ConversationState.CART_UPDATED]: [
      ConversationState.CART_ACTIVE,
      ConversationState.CHECKOUT,
      ConversationState.CHECKOUT_STARTED,
      ConversationState.BROWSING,
    ],

    [ConversationState.CHECKOUT]: [
      ConversationState.CHECKOUT_STARTED,
      ConversationState.PAYMENT_PENDING,
      ConversationState.CART_ACTIVE,
    ],

    [ConversationState.CHECKOUT_STARTED]: [
      ConversationState.PAYMENT_PENDING,
      ConversationState.CART_ACTIVE,
      ConversationState.CANCELLED,
    ],

    [ConversationState.PAYMENT_PENDING]: [
      ConversationState.ORDER_CONFIRMED,
      ConversationState.ORDER_FAILED,
    ],

    [ConversationState.ORDER_CONFIRMED]: [
      ConversationState.COMPLETED,
      ConversationState.IDLE,
    ],

    [ConversationState.ORDER_FAILED]: [
      ConversationState.CHECKOUT,
      ConversationState.CART_ACTIVE,
      ConversationState.CANCELLED,
    ],

    [ConversationState.ABANDONED]: [
      ConversationState.RECOVERY_FLOW,
      ConversationState.IDLE,
    ],

    [ConversationState.RECOVERY_FLOW]: [
      ConversationState.CART_ACTIVE,
      ConversationState.CHECKOUT,
      ConversationState.IDLE,
    ],

    [ConversationState.COMPLETED]: [
      ConversationState.IDLE,
    ],

    [ConversationState.CANCELLED]: [
      ConversationState.IDLE,
    ],

    [ConversationState.ERROR]: [
      ConversationState.IDLE,
      ConversationState.RECOVERY_FLOW,
    ],
  };

  canTransition(current: ConversationState, next: ConversationState): boolean {
    const allowed = this.transitions[current];
    if (!allowed) return false;
    return allowed.includes(next);
  }

  enforce(current: ConversationState, next: ConversationState): void {
    if (!this.canTransition(current, next)) {
      throw new Error(`[TRANSITION BLOCKED] ${current} → ${next} is not allowed`);
    }
  }

  getAllowedTransitions(state: ConversationState): ConversationState[] {
    return this.transitions[state] ?? [];
  }
}
