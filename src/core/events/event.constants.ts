// FILE: src/core/events/event.constants.ts

/**
 * =====================================================
 * 🧠 CONVERSATION EVENTS
 * FILE: src/modules/conversation/*
 *
 * PURPOSE:
 * Pure conversational signals.
 * NEVER business truth.
 * NEVER order persistence.
 * NEVER payment truth.
 * =====================================================
 */
export const CONVERSATION_EVENTS = {
  MESSAGE_RECEIVED: 'conversation.message.received',
  INTENT_DETECTED: 'conversation.intent.detected',
  STATE_CHANGED: 'conversation.state.changed',
  RESPONSE_READY: 'conversation.response.ready',

  // conversational orchestration signals only
  CART_UPDATED: 'conversation.cart.updated',
  CHECKOUT_REQUESTED: 'conversation.checkout.requested',
  ORDER_CONFIRMATION_REQUESTED: 'conversation.order.confirmation.requested',
} as const;

/**
 * =====================================================
 * 🧾 CHECKOUT EVENTS
 * FILE: src/modules/checkout/*
 *
 * PURPOSE:
 * Checkout orchestration lifecycle.
 * Owns checkout pipeline only.
 * =====================================================
 */
export const CHECKOUT_EVENTS = {
  CHECKOUT_STARTED: 'checkout.started',
  CHECKOUT_VALIDATED: 'checkout.validated',
  CHECKOUT_FAILED: 'checkout.failed',
  CHECKOUT_CONFIRMED: 'checkout.confirmed',
  CHECKOUT_CANCELLED: 'checkout.cancelled',
  CHECKOUT_SUMMARY_GENERATED: 'checkout.summary.generated',
} as const;

/**
 * =====================================================
 * 📦 ORDER DOMAIN EVENTS
 * FILE: src/modules/orders/*
 *
 * PURPOSE:
 * Canonical order truth.
 * Orders module owns these.
 * =====================================================
 */
export const ORDER_EVENTS = {
  ORDER_CREATED: 'order.created',
  ORDER_STATUS_UPDATED: 'order.status.updated',
  ORDER_COMPLETED: 'order.completed',
  ORDER_CANCELLED: 'order.cancelled',
  ORDER_FAILED: 'order.failed',
} as const;

/**
 * =====================================================
 * 🧠 SESSION EVENTS
 * FILE: src/modules/sessions/*
 *
 * PURPOSE:
 * Session/cart lifecycle truth.
 * =====================================================
 */
export const SESSION_EVENTS = {
  SESSION_CREATED: 'session.created',
  SESSION_UPDATED: 'session.updated',
  SESSION_EXPIRED: 'session.expired',

  CART_ITEM_ADDED: 'session.cart.item.added',
  CART_ITEM_REMOVED: 'session.cart.item.removed',
  CART_CLEARED: 'session.cart.cleared',
} as const;

/**
 * =====================================================
 * 🏢 BUSINESS DOMAIN EVENTS
 * FILE: src/modules/business/*
 * =====================================================
 */
export const BUSINESS_EVENTS = {
  BUSINESS_CREATED: 'business.created',
  BUSINESS_UPDATED: 'business.updated',

  RESTAURANT_SETTINGS_UPDATED: 'restaurant.settings.updated',
} as const;

/**
 * =====================================================
 * 🛒 CATALOG EVENTS
 * FILE: src/modules/catalog/*
 * =====================================================
 */
export const CATALOG_EVENTS = {
  PRODUCT_CREATED: 'product.created',
  PRODUCT_UPDATED: 'product.updated',
  PRODUCT_DELETED: 'product.deleted',

  CATEGORY_CREATED: 'category.created',
  CATEGORY_UPDATED: 'category.updated',
  CATEGORY_DELETED: 'category.deleted',
} as const;

/**
 * =====================================================
 * GLOBAL TYPE SAFETY
 * =====================================================
 */
export type AppEventType =
  | typeof CONVERSATION_EVENTS[keyof typeof CONVERSATION_EVENTS]
  | typeof CHECKOUT_EVENTS[keyof typeof CHECKOUT_EVENTS]
  | typeof ORDER_EVENTS[keyof typeof ORDER_EVENTS]
  | typeof SESSION_EVENTS[keyof typeof SESSION_EVENTS]
  | typeof BUSINESS_EVENTS[keyof typeof BUSINESS_EVENTS]
  | typeof CATALOG_EVENTS[keyof typeof CATALOG_EVENTS]
  | typeof PAYMENT_EVENTS[keyof typeof PAYMENT_EVENTS]
  | typeof WHATSAPP_EVENTS[keyof typeof WHATSAPP_EVENTS];

export const PAYMENT_EVENTS = {
  PAYMENT_CONFIRMED: 'payment.confirmed',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_INITIATED: 'payment.initiated',
  PAYMENT_REFUNDED: 'payment.refunded',
  PAYMENT_RECONCILED: 'payment.reconciled',
} as const;

export const WHATSAPP_EVENTS = {
  WHATSAPP_DELIVERY_FAILED: 'whatsapp.delivery.failed',
  WHATSAPP_DELIVERY_DEAD_LETTER: 'whatsapp.delivery.dead_letter',
  ORDER_NOTIFICATION_FAILED: 'whatsapp.order.notification.failed',
  CONVERSATION_RESPONSE_READY: 'conversation.response.ready',
} as const;
