// FILE: src/modules/protection/domain/enums/recovery-reason.enum.ts

/**
 * RecoveryReason
 * ---------------------------------------------------
 * Canonical recovery triggers across the entire system.
 *
 * PURPOSE:
 * - Standardize WHY recovery happened
 * - Enable analytics + observability
 * - Support workflow repair decisions
 * - Drive recovery strategies/pipelines
 *
 * IMPORTANT:
 * This enum is SHARED across:
 * - checkout
 * - sessions
 * - conversations
 * - payments
 * - queues
 * - schedulers
 * - reconnect handling
 */

export enum RecoveryReason {
  // ==================================================
  // CONNECTION / CHANNEL FAILURES
  // ==================================================

  /**
   * User disconnected then reconnected.
   * Common in WhatsApp/mobile instability.
   */
  RECONNECT = 'RECONNECT',

  /**
   * Message delivery timeout.
   */
  TIMEOUT = 'TIMEOUT',

  /**
   * Message retried after transport failure.
   */
  RETRY = 'RETRY',

  // ==================================================
  // CHECKOUT / PAYMENT FAILURES
  // ==================================================

  /**
   * Payment gateway failure.
   */
  PAYMENT_FAILED = 'PAYMENT_FAILED',

  /**
   * Payment confirmation delayed/stuck.
   */
  PAYMENT_TIMEOUT = 'PAYMENT_TIMEOUT',

  /**
   * Checkout became inconsistent.
   */
  CHECKOUT_INCONSISTENT = 'CHECKOUT_INCONSISTENT',

  // ==================================================
  // SESSION / CART RECOVERY
  // ==================================================

  /**
   * User abandoned workflow then returned.
   */
  ABANDONED = 'ABANDONED',

  /**
   * Expired session restored safely.
   */
  SESSION_EXPIRED = 'SESSION_EXPIRED',

  /**
   * Cart restored after interruption.
   */
  CART_RESTORED = 'CART_RESTORED',

  // ==================================================
  // IDEMPOTENCY / DUPLICATION
  // ==================================================

  /**
   * Duplicate inbound message detected.
   */
  DUPLICATE_MESSAGE = 'DUPLICATE_MESSAGE',

  /**
   * Duplicate payment callback/webhook detected.
   */
  DUPLICATE_PAYMENT = 'DUPLICATE_PAYMENT',

  /**
   * Duplicate order creation prevented.
   */
  DUPLICATE_ORDER = 'DUPLICATE_ORDER',

  // ==================================================
  // WORKFLOW CONSISTENCY
  // ==================================================

  /**
   * Workflow state mismatch detected.
   */
  STATE_MISMATCH = 'STATE_MISMATCH',

  /**
   * Workflow became stale or frozen.
   */
  STALE_WORKFLOW = 'STALE_WORKFLOW',

  /**
   * Missing required workflow state.
   */
  MISSING_STATE = 'MISSING_STATE',

  /**
   * Invalid state transition detected.
   */
  INVALID_TRANSITION = 'INVALID_TRANSITION',

  // ==================================================
  // LOCKING / DISTRIBUTED SYSTEMS
  // ==================================================

  /**
   * Workflow lock collision detected.
   */
  LOCK_CONFLICT = 'LOCK_CONFLICT',

  /**
   * Distributed processing race condition.
   */
  RACE_CONDITION = 'RACE_CONDITION',

  // ==================================================
  // SYSTEM SAFETY
  // ==================================================

  /**
   * Tenant boundary violation attempt.
   */
  TENANT_SCOPE_VIOLATION = 'TENANT_SCOPE_VIOLATION',

  /**
   * Internal protection engine repair trigger.
   */
  AUTO_REPAIR = 'AUTO_REPAIR',

  /**
   * Unknown/unclassified recovery trigger.
   */
  UNKNOWN = 'UNKNOWN',
}