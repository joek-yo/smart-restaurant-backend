/**
 * ConversationEvent
 * ----------------------
 * Internal event contracts for EventBus.
 * Used for decoupling the Conversation Engine from Orders, Notifications, and Analytics.
 */
export enum ConversationEvent {
  // 🟢 Lifecycle & Entry
  MESSAGE_RECEIVED = 'conversation.message.received',
  CONVERSATION_STARTED = 'conversation.started',
  CONVERSATION_UPDATED = 'conversation.updated',
  CONVERSATION_ENDED = 'conversation.ended',

  // 🧠 Processing
  INTENT_DETECTED = 'conversation.intent.detected',
  STATE_CHANGED = 'conversation.state.changed',

  // 🛒 Commerce flow
  CART_UPDATED = 'conversation.cart.updated',
  CHECKOUT_INITIATED = 'conversation.checkout.initiated',

  // 💳 Order flow (Namespaced for potential cross-module consumption)
  ORDER_REQUESTED = 'order.create.requested',
  ORDER_CONFIRMED = 'order.confirmed',
  ORDER_FAILED = 'order.failed',

  // 🔄 Recovery
  ABANDONMENT_DETECTED = 'conversation.abandonment.detected',
  RECOVERY_TRIGGERED = 'conversation.recovery.triggered',
}
