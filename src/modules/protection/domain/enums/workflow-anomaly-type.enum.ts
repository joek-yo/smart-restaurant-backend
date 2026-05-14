// FILE: src/modules/protection/domain/enums/workflow-anomaly-type.enum.ts

/**
 * WorkflowAnomalyType
 * ---------------------------------------------------
 * Canonical classification of workflow inconsistencies.
 *
 * PURPOSE:
 * - Detect system corruption patterns
 * - Drive automated repair strategies
 * - Feed observability + alerting
 * - Support recovery engine decisions
 *
 * These anomalies are detected across:
 * - conversation engine
 * - session engine
 * - checkout engine
 * - payment engine
 * - order engine
 * - distributed locks
 * - idempotency layer
 */

export enum WorkflowAnomalyType {
  // ==================================================
  // 🔁 STATE CORRUPTION
  // ==================================================

  /**
   * Workflow is in an unknown or invalid state.
   */
  INVALID_STATE = 'INVALID_STATE',

  /**
   * Workflow state does not match expected lifecycle order.
   */
  OUT_OF_ORDER_STATE = 'OUT_OF_ORDER_STATE',

  /**
   * Missing required state transition.
   */
  MISSING_TRANSITION = 'MISSING_TRANSITION',

  /**
   * State jump detected without valid transition path.
   */
  ILLEGAL_STATE_JUMP = 'ILLEGAL_STATE_JUMP',

  // ==================================================
  // 🧠 CROSS-SYSTEM INCONSISTENCY
  // ==================================================

  /**
   * Conversation state and session state diverged.
   */
  CONTEXT_SESSION_MISMATCH = 'CONTEXT_SESSION_MISMATCH',

  /**
   * Checkout state does not match session/cart state.
   */
  CHECKOUT_DESYNC = 'CHECKOUT_DESYNC',

  /**
   * Payment state inconsistent with checkout/order state.
   */
  PAYMENT_DESYNC = 'PAYMENT_DESYNC',

  /**
   * Order exists but upstream workflow missing.
   */
  ORPHAN_ORDER = 'ORPHAN_ORDER',

  // ==================================================
  // 🔄 DUPLICATION ANOMALIES
  // ==================================================

  /**
   * Duplicate message processed multiple times.
   */
  DUPLICATE_MESSAGE = 'DUPLICATE_MESSAGE',

  /**
   * Duplicate checkout session created.
   */
  DUPLICATE_CHECKOUT_SESSION = 'DUPLICATE_CHECKOUT_SESSION',

  /**
   * Duplicate order creation detected.
   */
  DUPLICATE_ORDER = 'DUPLICATE_ORDER',

  /**
   * Duplicate payment webhook or callback.
   */
  DUPLICATE_PAYMENT_EVENT = 'DUPLICATE_PAYMENT_EVENT',

  // ==================================================
  // ⛓️ LOCK / CONCURRENCY ISSUES
  // ==================================================

  /**
   * Two processes acquired same workflow lock.
   */
  LOCK_COLLISION = 'LOCK_COLLISION',

  /**
   * Race condition between parallel workflow handlers.
   */
  RACE_CONDITION = 'RACE_CONDITION',

  /**
   * Lock acquired but never released.
   */
  STALE_LOCK = 'STALE_LOCK',

  // ==================================================
  // 🕒 TIME-BASED ANOMALIES
  // ==================================================

  /**
   * Workflow exceeded expected execution time.
   */
  TIMEOUT = 'TIMEOUT',

  /**
   * Workflow stuck without progress.
   */
  STALE_WORKFLOW = 'STALE_WORKFLOW',

  /**
   * No state change over expected window.
   */
  NO_PROGRESS = 'NO_PROGRESS',

  // ==================================================
  // 💾 DATA CORRUPTION
  // ==================================================

  /**
   * Missing required workflow data.
   */
  MISSING_DATA = 'MISSING_DATA',

  /**
   * Corrupted or unreadable workflow payload.
   */
  CORRUPTED_DATA = 'CORRUPTED_DATA',

  /**
   * Partial workflow state persisted.
   */
  PARTIAL_PERSISTENCE = 'PARTIAL_PERSISTENCE',

  // ==================================================
  // 🔐 IDENTITY / TENANT ISSUES
  // ==================================================

  /**
   * Workflow accessed across wrong tenant boundary.
   */
  TENANT_VIOLATION = 'TENANT_VIOLATION',

  /**
   * User mismatch between workflow stages.
   */
  USER_MISMATCH = 'USER_MISMATCH',

  // ==================================================
  // ⚠️ SYSTEM FAILURES
  // ==================================================

  /**
   * Unexpected internal system error.
   */
  INTERNAL_FAILURE = 'INTERNAL_FAILURE',

  /**
   * External dependency failure (payment gateway, API, etc).
   */
  DEPENDENCY_FAILURE = 'DEPENDENCY_FAILURE',

  /**
   * Unknown anomaly that cannot be classified.
   */
  UNKNOWN = 'UNKNOWN',

  // ➕ ADDITIONAL TYPES (referenced by services)
  STATE_CORRUPTION             = 'STATE_CORRUPTION',
  INVALID_TRANSITION           = 'INVALID_TRANSITION',
  DUPLICATE_PROCESSING         = 'DUPLICATE_PROCESSING',
  CROSS_TENANT_ACCESS          = 'CROSS_TENANT_ACCESS',
  ABANDONED_WORKFLOW           = 'ABANDONED_WORKFLOW',
  INVALID_CONVERSATION_STATE   = 'INVALID_CONVERSATION_STATE',
  INVALID_SESSION_STATE        = 'INVALID_SESSION_STATE',
  INVALID_CHECKOUT_STATE       = 'INVALID_CHECKOUT_STATE',
  INVALID_PAYMENT_STATE        = 'INVALID_PAYMENT_STATE',
  INVALID_ORDER_STATE          = 'INVALID_ORDER_STATE',
  ORDER_PAYMENT_MISMATCH       = 'ORDER_PAYMENT_MISMATCH',
  PAYMENT_WITHOUT_CHECKOUT     = 'PAYMENT_WITHOUT_CHECKOUT',
  CHECKOUT_WITHOUT_SESSION     = 'CHECKOUT_WITHOUT_SESSION',
  TIMELINE_CORRUPTION          = 'TIMELINE_CORRUPTION',
}
