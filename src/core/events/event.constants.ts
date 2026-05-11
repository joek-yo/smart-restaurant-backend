// FILE: src/core/events/event.constants.ts

export const EVENTS = {
  // =========================
  // 🏢 BUSINESS DOMAIN EVENTS
  // FILE: src/modules/business/*
  // =========================
  BUSINESS_CREATED: 'business.created',
  BUSINESS_UPDATED: 'business.updated',

  // ⚠️ FIX: previously missing but used in catalog module
  RESTAURANT_SETTINGS_UPDATED: 'restaurant.settings.updated',

  // =========================
  // 📦 ORDER DOMAIN EVENTS
  // FILE: src/modules/orders/*
  // =========================
  ORDER_CREATED: 'order.created',
  ORDER_STATUS_UPDATED: 'order.status.updated',
  ORDER_COMPLETED: 'order.completed',
  ORDER_CANCELLED: 'order.cancelled',

  // =========================
  // 🛒 PRODUCT DOMAIN EVENTS
  // FILE: src/modules/catalog/*
  // =========================
  PRODUCT_CREATED: 'product.created',
  PRODUCT_UPDATED: 'product.updated',
  PRODUCT_DELETED: 'product.deleted',

  // =========================
  // 🗂 CATEGORY DOMAIN EVENTS
  // FILE: src/modules/catalog/*
  // =========================
  CATEGORY_CREATED: 'category.created',
  CATEGORY_UPDATED: 'category.updated',
  CATEGORY_DELETED: 'category.deleted',

  // =========================
  // 🧾 CHECKOUT WORKFLOW EVENTS (NEW CORE FLOW)
  // FILE: src/modules/checkout/*
  // =========================
  CHECKOUT_STARTED: 'checkout.started',
  CHECKOUT_VALIDATED: 'checkout.validated',
  CHECKOUT_CONFIRMED: 'checkout.confirmed',
  CHECKOUT_CANCELLED: 'checkout.cancelled',
  CHECKOUT_SUMMARY_GENERATED: 'checkout.summary.generated',

  // =========================
  // 🧠 SESSION LIFECYCLE EVENTS
  // FILE: src/modules/sessions/*
  // =========================
  SESSION_CREATED: 'session.created',
  SESSION_UPDATED: 'session.updated',
  SESSION_EXPIRED: 'session.expired',
} as const;

// =====================================================
// 🧠 CONVERSATION / AI LAYER EVENTS
// FILE: src/modules/conversation/*
// =====================================================
export const CONVERSATION_EVENTS = {
  MESSAGE_RECEIVED: 'conversation.message.received',
  INTENT_DETECTED: 'conversation.intent.detected',
  STATE_CHANGED: 'conversation.state.changed',
  RESPONSE_READY: 'conversation.response.ready',

  // UI / chatbot level triggers (NOT business truth)
  CART_UPDATED: 'conversation.cart.updated',
  CHECKOUT_STARTED: 'conversation.checkout.started',

  // ⚠️ IMPORTANT:
  // This is ONLY a trigger to checkout flow
  // Actual order creation happens in Orders module
  ORDER_REQUESTED: 'order.create.requested',
} as const;

// =====================================================
// TYPE SAFETY FOR EVENT SYSTEM
// Covers both EVENTS and CONVERSATION_EVENTS
// =====================================================
export type AppEventType =
  | typeof EVENTS[keyof typeof EVENTS]
  | typeof CONVERSATION_EVENTS[keyof typeof CONVERSATION_EVENTS];