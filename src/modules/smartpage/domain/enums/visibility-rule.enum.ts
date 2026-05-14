// FILE: src/modules/smartpage/domain/enums/visibility-rule.enum.ts

/**
 * VisibilityRule
 * ---------------------------------------------------
 * CONDITIONAL RENDERING CONTRACT
 *
 * Determines whether a SmartPage block
 * should be visible for a given runtime context.
 *
 * Used by:
 * - VisibilityEngineService
 * - Personalization engine
 * - Recommendation engine
 * - Checkout rendering
 * - Dynamic SmartPage orchestration
 *
 * IMPORTANT:
 * These are PURE business/runtime conditions.
 * NOT UI states.
 */

export enum VisibilityRule {
  // ==================================================
  // 👤 USER CONTEXT
  // ==================================================

  IS_NEW_USER = 'IS_NEW_USER',

  IS_RETURNING_USER = 'IS_RETURNING_USER',

  IS_LOGGED_IN = 'IS_LOGGED_IN',

  IS_GUEST = 'IS_GUEST',

  // ==================================================
  // 🛒 CART CONTEXT
  // ==================================================

  HAS_CART = 'HAS_CART',

  EMPTY_CART = 'EMPTY_CART',

  HAS_MULTIPLE_ITEMS = 'HAS_MULTIPLE_ITEMS',

  HAS_HIGH_CART_VALUE = 'HAS_HIGH_CART_VALUE',

  // ==================================================
  // 🚀 CHECKOUT CONTEXT
  // ==================================================

  IS_CHECKOUT_ACTIVE = 'IS_CHECKOUT_ACTIVE',

  IS_PAYMENT_PENDING = 'IS_PAYMENT_PENDING',

  HAS_ACTIVE_ORDER = 'HAS_ACTIVE_ORDER',

  // ==================================================
  // 🎯 RECOMMENDATION / AI CONTEXT
  // ==================================================

  HAS_RECOMMENDATIONS = 'HAS_RECOMMENDATIONS',

  HAS_RECENTLY_VIEWED = 'HAS_RECENTLY_VIEWED',

  HAS_PERSONALIZED_CONTENT = 'HAS_PERSONALIZED_CONTENT',

  // ==================================================
  // 🏪 BUSINESS CONTEXT
  // ==================================================

  BUSINESS_OPEN = 'BUSINESS_OPEN',

  BUSINESS_CLOSED = 'BUSINESS_CLOSED',

  HAS_FLASH_SALE = 'HAS_FLASH_SALE',

  HAS_FEATURED_PRODUCTS = 'HAS_FEATURED_PRODUCTS',

  // ==================================================
  // 📦 CATALOG CONTEXT
  // ==================================================

  HAS_PRODUCTS = 'HAS_PRODUCTS',

  HAS_CATEGORIES = 'HAS_CATEGORIES',

  HAS_TRENDING_PRODUCTS = 'HAS_TRENDING_PRODUCTS',

  HAS_BEST_SELLERS = 'HAS_BEST_SELLERS',

  // ==================================================
  // 🌍 CHANNEL / PLATFORM CONTEXT
  // ==================================================

  IS_WHATSAPP = 'IS_WHATSAPP',

  IS_WEB = 'IS_WEB',

  IS_MOBILE = 'IS_MOBILE',

  // ==================================================
  // 🧠 RECOVERY / WORKFLOW CONTEXT
  // ==================================================

  IS_RECOVERY_FLOW = 'IS_RECOVERY_FLOW',

  HAS_ABANDONED_CART = 'HAS_ABANDONED_CART',

  // ==================================================
  // 🔒 FALLBACK
  // ==================================================

  ALWAYS = 'ALWAYS',

  NEVER = 'NEVER',
}