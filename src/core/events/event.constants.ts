// src/core/events/event.constants.ts

export const EVENTS = {
  // Business Events
  BUSINESS_CREATED: 'business.created',
  BUSINESS_UPDATED: 'business.updated',

  // Order Events
  ORDER_CREATED: 'order.created',
  ORDER_STATUS_UPDATED: 'order.status.updated',
  ORDER_COMPLETED: 'order.completed',
  ORDER_CANCELLED: 'order.cancelled',

  // Menu/Product Events
  PRODUCT_CREATED: 'product.created',
  PRODUCT_UPDATED: 'product.updated',
  PRODUCT_DELETED: 'product.deleted',

  // Category Events
  CATEGORY_CREATED: 'category.created',
  CATEGORY_UPDATED: 'category.updated',
  CATEGORY_DELETED: 'category.deleted',
} as const;

// Type helper so you can use it in listeners: 
// e.g. @OnEvent(EVENTS.BUSINESS_CREATED)
export type AppEventType = typeof EVENTS[keyof typeof EVENTS];
// === CONVERSATION EVENTS (NEW SECTION) ===
export const CONVERSATION_EVENTS = {
  MESSAGE_RECEIVED: 'conversation.message.received',
  INTENT_DETECTED: 'conversation.intent.detected',
  STATE_CHANGED: 'conversation.state.changed',
  RESPONSE_READY: 'conversation.response.ready',

  // Downstream business triggers
  CART_UPDATED: 'conversation.cart.updated',
  CHECKOUT_STARTED: 'conversation.checkout.started',
  ORDER_REQUESTED: 'order.create.requested',
} as const;
