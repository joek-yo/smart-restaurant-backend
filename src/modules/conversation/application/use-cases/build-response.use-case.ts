// src/modules/conversation/application/use-cases/build-response.use-case.ts

import { Injectable } from '@nestjs/common';

const LOCKED_STATES = [
  'PAYMENT_PENDING',
  'ORDER_CONFIRMED',
];

@Injectable()
export class BuildResponseUseCase {

  execute({
    intent,
    transition,
    currentState,
  }: {
    intent: string;
    transition: { nextState: string };
    currentState: string;
  }): string {

    // =========================
    // 🔒 LOCKED STATES OVERRIDE EVERYTHING
    // =========================
    if (LOCKED_STATES.includes(currentState)) {
      return this.stateAwareResponse(currentState);
    }

    // =========================
    // 🧭 INTENT-ASSISTED RESPONSES (SOFT LAYER)
    // =========================
    switch (intent) {

      case 'ADD_TO_CART':
        return 'Item added successfully. You can continue shopping or proceed to checkout.';

      case 'REMOVE_FROM_CART':
        return 'Item removed successfully.';

      case 'VIEW_CART':
        return 'Here is your current selection. You can add more items or proceed when ready.';

      case 'VIEW_PRODUCTS':
        return 'Here are the available items. You can add any item to continue.';

      case 'CHECKOUT':
        return 'Reviewing your selection. You may confirm or cancel.';

      case 'CONFIRM_ORDER':
        return 'Order confirmation in progress. Please wait.';

      case 'CANCEL_ORDER':
        return 'Process cancelled. You can start again anytime.';

      case 'ASK_HELP':
        return `You can:
- browse items
- add items
- view selection
- proceed to checkout
- cancel process`;

      case 'SMALL_TALK':
      default:
        return this.stateAwareResponse(currentState);
    }
  }

  // =========================
  // 🧠 STATE-DRIVEN RESPONSES (PRIMARY SOURCE OF TRUTH)
  // =========================
  private stateAwareResponse(state: string): string {

    switch (state) {

      case 'IDLE':
        return 'Welcome. You can browse available items or ask for help.';

      case 'BROWSING':
        return 'You are browsing available items. You may add items to continue.';

      case 'CART_ACTIVE':
        return 'You have selected items. You may continue shopping or proceed when ready.';

      case 'CHECKOUT':
        return 'Checkout is in progress. You may confirm or cancel.';

      case 'PAYMENT_PENDING':
        return 'Processing your request. Please wait or cancel if needed.';

      case 'ORDER_CONFIRMED':
        return 'Your request has been completed successfully.';

      case 'ORDER_FAILED':
        return 'Something went wrong. You may retry or cancel.';

      case 'ABANDONED':
      case 'RECOVERY_FLOW':
        return 'You can continue where you left off or start a new session.';

      default:
        return 'System ready. You may proceed.';
    }
  }
}