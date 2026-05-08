// src/modules/conversation/domain/enums/conversation-state.enum.ts

/**
 * ConversationState
 * ----------------------
 * Core state machine for channel-agnostic conversation flow.
 * This is the backbone of the Conversation Engine.
 */
export enum ConversationState {
  // 🟢 Entry states
  IDLE = 'IDLE',
  STARTED = 'STARTED',

  // 🟡 Exploration
  BROWSING = 'BROWSING',
  VIEWING_PRODUCT = 'VIEWING_PRODUCT',

  // 🛒 Cart behavior
  CART_ACTIVE = 'CART_ACTIVE',
  CART_UPDATED = 'CART_UPDATED',

  // 💳 Checkout flow
  CHECKOUT = 'CHECKOUT', // Merged from second version
  CHECKOUT_STARTED = 'CHECKOUT_STARTED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',

  // ✅ Completion
  ORDER_CONFIRMED = 'ORDER_CONFIRMED',
  ORDER_FAILED = 'ORDER_FAILED',

  // 🔄 Recovery flow
  ABANDONED = 'ABANDONED',
  RECOVERY_FLOW = 'RECOVERY_FLOW', // Replaced RECOVERY_STARTED with this from your second version
  
  // ❌ Terminal states
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',

  // ⚠️ Safety fallback
  ERROR = 'ERROR',
}