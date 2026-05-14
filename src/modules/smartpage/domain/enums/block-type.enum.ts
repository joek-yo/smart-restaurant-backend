// FILE: src/modules/smartpage/domain/enums/block-type.enum.ts

/**
 * SmartPage Block Types
 * -------------------------------------------------------
 * Defines ALL renderable block contracts in the SmartPage engine.
 *
 * IMPORTANT:
 * - Every visual/renderable unit MUST map to a block type
 * - Renderer pipelines depend on this enum
 * - Visibility engine depends on this enum
 * - Personalization engine depends on this enum
 * - Analytics/metrics depend on this enum
 *
 * SmartPage NEVER renders arbitrary structures.
 * Everything MUST be a typed block.
 */

export enum BlockType {
  // ======================================================
  // CORE VISUAL BLOCKS
  // ======================================================

  HERO = 'HERO',

  BANNER = 'BANNER',

  TEXT = 'TEXT',

  IMAGE = 'IMAGE',

  DIVIDER = 'DIVIDER',

  // ======================================================
  // CATALOG / PRODUCT BLOCKS
  // ======================================================

  CATALOG = 'CATALOG',

  CATEGORY = 'CATEGORY',

  PRODUCT = 'PRODUCT',

  PRODUCT_GRID = 'PRODUCT_GRID',

  PRODUCT_CAROUSEL = 'PRODUCT_CAROUSEL',

  PRODUCT_HIGHLIGHT = 'PRODUCT_HIGHLIGHT',

  // ======================================================
  // COMMERCE BLOCKS
  // ======================================================

  CART = 'CART',

  CART_SUMMARY = 'CART_SUMMARY',

  CHECKOUT = 'CHECKOUT',

  PAYMENT = 'PAYMENT',

  ORDER_SUMMARY = 'ORDER_SUMMARY',

  // ======================================================
  // PERSONALIZATION / AI BLOCKS
  // ======================================================

  RECOMMENDATION = 'RECOMMENDATION',

  RECENTLY_VIEWED = 'RECENTLY_VIEWED',

  TRENDING_PRODUCTS = 'TRENDING_PRODUCTS',

  FREQUENTLY_BOUGHT_TOGETHER = 'FREQUENTLY_BOUGHT_TOGETHER',

  PERSONALIZED_FEED = 'PERSONALIZED_FEED',

  // ======================================================
  // RECOVERY / WORKFLOW BLOCKS
  // ======================================================

  ABANDONED_CART = 'ABANDONED_CART',

  RECOVERY = 'RECOVERY',

  RECONNECT = 'RECONNECT',

  CHECKOUT_RECOVERY = 'CHECKOUT_RECOVERY',

  // ======================================================
  // BUSINESS / TRUST BLOCKS
  // ======================================================

  BUSINESS_INFO = 'BUSINESS_INFO',

  DELIVERY_INFO = 'DELIVERY_INFO',

  TRUST_BAR = 'TRUST_BAR',

  SOCIAL_PROOF = 'SOCIAL_PROOF',

  TESTIMONIALS = 'TESTIMONIALS',

  // ======================================================
  // NAVIGATION BLOCKS
  // ======================================================

  NAVIGATION = 'NAVIGATION',

  FOOTER = 'FOOTER',

  SIDEBAR = 'SIDEBAR',

  SEARCH = 'SEARCH',

  // ======================================================
  // SYSTEM / FALLBACK BLOCKS
  // ======================================================

  EMPTY_STATE = 'EMPTY_STATE',

  ERROR_STATE = 'ERROR_STATE',

  LOADING_STATE = 'LOADING_STATE',

  NOT_FOUND = 'NOT_FOUND',
}