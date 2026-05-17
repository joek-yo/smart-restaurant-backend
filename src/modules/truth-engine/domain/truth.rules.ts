// FILE: src/modules/truth-engine/domain/truth.rules.ts

/**
 * Truth Engine Event Bus Rules
 * ----------------------------
 * This file defines global consistency rules for ALL event emissions
 * across the entire system.
 *
 * PURPOSE:
 * - Prevent silent state mutations
 * - Enforce deterministic event naming
 * - Guarantee cache invalidation reliability
 * - Ensure Truth Engine can rebuild snapshots safely
 */

export const TruthEventRules = {
  // ==================================================
  // 🚨 CORE RULES (NON-NEGOTIABLE)
  // ==================================================

  requireEventOnMutation: true,
  allowSilentMutations: false,

  enforceEventNamingConvention: true,
  namingConvention: 'domain.action',

  // ==================================================
  // 🧠 EVENT GROUPS (VALID SYSTEM EVENTS)
  // ==================================================

  session: {
    requiredEvents: [
      'session.created',
      'session.updated',
      'session.checkout.started',
      'session.cart.item.added',
      'session.cart.item.removed',
      'session.cart.item.updated',
      'session.cart.cleared',
    ],
  },

  business: {
    requiredEvents: [
      'business.created',
      'business.updated',
      'business.deleted',
      'catalog.settings.updated',
    ],
  },

  catalog: {
    requiredEvents: [
      'product.created',
      'product.updated',
      'product.deleted',
      'category.created',
      'category.updated',
      'category.deleted',
      'catalog.changed',
    ],
  },

  // ==================================================
  // 🔥 INVALIDATION STRATEGY RULES
  // ==================================================

  cacheInvalidationStrategy: {
    sessionEventsInvalidate: true,
    businessEventsInvalidate: true,
    catalogEventsInvalidate: true,
    globalFallbackEvent: 'catalog.changed',
  },

  // ==================================================
  // 🧪 DEBUG / SAFETY
  // ==================================================

  allowUnknownEvents: false,

  logMissingEvents: true,
};