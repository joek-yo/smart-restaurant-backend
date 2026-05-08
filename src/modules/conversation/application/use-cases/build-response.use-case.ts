// src/modules/conversation/application/use-cases/build-response.use-case.ts
import { Injectable } from '@nestjs/common';

const LOCKED_STATES = ['PAYMENT_PENDING', 'ORDER_CONFIRMED'];

@Injectable()
export class BuildResponseUseCase {
  execute({ intent, transition, currentState }: {
    intent: string;
    transition: { nextState: string };
    currentState: string;
  }): string {

    // 🔒 Locked states always return state-aware response
    // regardless of intent
    if (LOCKED_STATES.includes(currentState)) {
      return this.stateAwareResponse(currentState);
    }

    // Intent-specific responses
    switch (intent) {
      case 'ADD_TO_CART':
        return '✅ Item added to your cart. Type "my cart" to review or "checkout" when ready.';
      case 'REMOVE_FROM_CART':
        return '🗑️ Item removed from your cart.';
      case 'VIEW_CART':
        return '🛒 Here is your cart. Type "checkout" to proceed or "add [item]" to add more.';
      case 'VIEW_PRODUCTS':
        return '🛍️ Here is our menu. Type "add [item name]" to add something to your cart.';
      case 'CHECKOUT':
        return '💳 Reviewing your order. Type "confirm order" to place it or "cancel" to go back.';
      case 'CONFIRM_ORDER':
        return '⏳ Order confirmed! Processing your payment...';
      case 'CANCEL_ORDER':
        return '❌ Order cancelled. Type "menu" to start again.';
      case 'ASK_HELP':
        return '👋 Here is what you can do:\n• "menu" — browse products\n• "add [item]" — add to cart\n• "my cart" — view cart\n• "checkout" — place order\n• "cancel" — cancel order';
    }

    // State-aware fallback for SMALL_TALK / UNKNOWN
    return this.stateAwareResponse(currentState);
  }

  private stateAwareResponse(state: string): string {
    switch (state) {
      case 'IDLE':
        return '👋 Welcome! Type "menu" to see what we offer or "help" for options.';
      case 'BROWSING':
        return '🛍️ You are browsing our menu. Type "add [item]" to add something to your cart.';
      case 'CART_ACTIVE':
        return '🛒 You have items in your cart. Type "my cart" to review, "add [item]" to add more, or "checkout" to order.';
      case 'CHECKOUT':
        return '💳 You are in checkout. Type "confirm order" to place your order or "cancel" to go back.';
      case 'PAYMENT_PENDING':
        return '⏳ Your order is being processed. Please wait.\nType "cancel" if you want to stop.';
      case 'ORDER_CONFIRMED':
        return '🎉 Your order has been confirmed! We will notify you when it is ready.';
      case 'ORDER_FAILED':
        return '❌ Something went wrong. Type "checkout" to try again or "cancel" to start over.';
      case 'ABANDONED':
      case 'RECOVERY_FLOW':
        return '👋 Welcome back! You have items in your cart. Type "my cart" to continue or "cancel" to start fresh.';
      default:
        return '🤖 Type "help" to see available options.';
    }
  }
}
