// src/modules/conversation/application/use-cases/resolve-transition.use-case.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class ResolveTransitionUseCase {
  execute({ state, intent }: { state: string; intent: string }) {

    // 🔒 SAFETY: Non-business intents never change state
    if (['SMALL_TALK', 'UNKNOWN', 'ASK_HELP'].includes(intent)) {
      return { nextState: state };
    }

    // 🔒 STATE GUARDS: Illegal transitions blocked
    // Cannot add to cart while payment is processing
    if (state === 'PAYMENT_PENDING' && intent !== 'CANCEL_ORDER') {
      return { nextState: state };
    }

    // Cannot checkout from confirmed order
    if (state === 'ORDER_CONFIRMED') {
      return { nextState: state };
    }

    // Cannot go to checkout with empty intent path
    if (state === 'IDLE' && intent === 'CHECKOUT') {
      return { nextState: state };
    }

    // ====================================
    // VALID TRANSITION MAP
    // ====================================
    const map: Record<string, Record<string, string>> = {
      IDLE: {
        VIEW_PRODUCTS: 'BROWSING',
        ADD_TO_CART:   'CART_ACTIVE',
        VIEW_CART:     'IDLE',
      },
      BROWSING: {
        ADD_TO_CART:   'CART_ACTIVE',
        VIEW_CART:     'CART_ACTIVE',
        VIEW_PRODUCTS: 'BROWSING',
      },
      CART_ACTIVE: {
        ADD_TO_CART:      'CART_ACTIVE',
        REMOVE_FROM_CART: 'CART_ACTIVE',
        VIEW_CART:        'CART_ACTIVE',
        CHECKOUT:         'CHECKOUT',
      },
      CHECKOUT: {
        CONFIRM_ORDER: 'PAYMENT_PENDING',
        CANCEL_ORDER:  'IDLE',
        ADD_TO_CART:   'CART_ACTIVE', // allow going back to cart
        VIEW_CART:     'CART_ACTIVE',
      },
      PAYMENT_PENDING: {
        CANCEL_ORDER: 'IDLE', // only escape from payment pending
      },
      ORDER_CONFIRMED: {}, // terminal — nothing allowed
      ORDER_FAILED: {
        CHECKOUT:     'CHECKOUT', // retry
        CANCEL_ORDER: 'IDLE',
      },
      ABANDONED: {
        ADD_TO_CART:  'CART_ACTIVE',
        VIEW_CART:    'CART_ACTIVE',
        CANCEL_ORDER: 'IDLE',
      },
    };

    const nextState =
      map[state]?.[intent] ||
      state; // default: stay in current state

    return { nextState };
  }
}
