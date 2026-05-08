/**
 * ConversationIntent
 * -----------------------
 * Represents WHY a user sent a message.
 * Used by IntentClassifier to determine the next transition.
 */
export enum ConversationIntent {
  // 🧭 Navigation & Meta
  START = 'START',
  ASK_HELP = 'ASK_HELP',
  UNKNOWN = 'UNKNOWN',

  // 🛒 Commerce / Shopping
  VIEW_PRODUCTS = 'VIEW_PRODUCTS',
  VIEW_PRODUCT_DETAIL = 'VIEW_PRODUCT_DETAIL',
  VIEW_CART = 'VIEW_CART',
  ADD_TO_CART = 'ADD_TO_CART',
  REMOVE_FROM_CART = 'REMOVE_FROM_CART',

  // 💳 Checkout & Fulfillment
  CHECKOUT = 'CHECKOUT',
  CONFIRM_ORDER = 'CONFIRM_ORDER',
  CANCEL_ORDER = 'CANCEL_ORDER',

  // 💬 Conversation Control
  SMALL_TALK = 'SMALL_TALK',

  // 🔄 Recovery & Persistence
  CONTINUE_ORDER = 'CONTINUE_ORDER',
  ABANDONED_RECOVERY = 'ABANDONED_RECOVERY',
}
