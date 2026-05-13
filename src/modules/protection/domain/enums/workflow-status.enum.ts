// FILE: src/modules/protection/domain/enums/workflow-status.enum.ts

/**
 * WorkflowStatus
 * ---------------------------------------------------
 * Unified workflow lifecycle across the entire system.
 *
 * PURPOSE:
 * - Create ONE canonical workflow language
 * - Normalize states from:
 *   - conversation engine
 *   - session engine
 *   - checkout engine
 *   - payment engine
 *   - order engine
 * - Power recovery + repair pipelines
 * - Detect stale/inconsistent workflows
 *
 * IMPORTANT:
 * This is NOT a replacement for domain-specific enums.
 *
 * Instead:
 * - ConversationState stays inside conversation domain
 * - SessionState stays inside session domain
 * - OrderStatus stays inside order domain
 *
 * THIS enum acts as:
 * → cross-system orchestration state
 * → workflow protection state
 * → observability state
 */

export enum WorkflowStatus {
  // ==================================================
  // 🟢 ENTRY / INITIALIZATION
  // ==================================================

  /**
   * Workflow initialized but not yet active.
   */
  CREATED = 'CREATED',

  /**
   * Workflow started successfully.
   */
  STARTED = 'STARTED',

  /**
   * Context/session loaded successfully.
   */
  RESTORED = 'RESTORED',

  // ==================================================
  // 💬 CONVERSATION STATES
  // ==================================================

  /**
   * User actively browsing/interacting.
   */
  ACTIVE = 'ACTIVE',

  /**
   * User browsing products/services.
   */
  BROWSING = 'BROWSING',

  /**
   * Product exploration state.
   */
  VIEWING_PRODUCT = 'VIEWING_PRODUCT',

  // ==================================================
  // 🛒 CART STATES
  // ==================================================

  /**
   * Cart exists and contains items.
   */
  CART_ACTIVE = 'CART_ACTIVE',

  /**
   * Cart recently modified.
   */
  CART_UPDATED = 'CART_UPDATED',

  /**
   * Cart abandoned by user.
   */
  CART_ABANDONED = 'CART_ABANDONED',

  // ==================================================
  // 💳 CHECKOUT STATES
  // ==================================================

  /**
   * Checkout initialized.
   */
  CHECKOUT_STARTED = 'CHECKOUT_STARTED',

  /**
   * Checkout validation running.
   */
  CHECKOUT_VALIDATING = 'CHECKOUT_VALIDATING',

  /**
   * Checkout passed validation.
   */
  CHECKOUT_VALID = 'CHECKOUT_VALID',

  /**
   * Checkout failed validation.
   */
  CHECKOUT_FAILED = 'CHECKOUT_FAILED',

  // ==================================================
  // 💰 PAYMENT STATES
  // ==================================================

  /**
   * Payment request created.
   */
  PAYMENT_CREATED = 'PAYMENT_CREATED',

  /**
   * Awaiting payment confirmation.
   */
  PAYMENT_PENDING = 'PAYMENT_PENDING',

  /**
   * Payment completed successfully.
   */
  PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED',

  /**
   * Payment failed/rejected.
   */
  PAYMENT_FAILED = 'PAYMENT_FAILED',

  /**
   * Payment timed out.
   */
  PAYMENT_TIMEOUT = 'PAYMENT_TIMEOUT',

  // ==================================================
  // 📦 ORDER STATES
  // ==================================================

  /**
   * Order successfully created.
   */
  ORDER_CREATED = 'ORDER_CREATED',

  /**
   * Order processing underway.
   */
  ORDER_PROCESSING = 'ORDER_PROCESSING',

  /**
   * Order fully completed.
   */
  ORDER_COMPLETED = 'ORDER_COMPLETED',

  /**
   * Order cancelled safely.
   */
  ORDER_CANCELLED = 'ORDER_CANCELLED',

  // ==================================================
  // 🔄 RECOVERY STATES
  // ==================================================

  /**
   * Recovery workflow triggered.
   */
  RECOVERY_STARTED = 'RECOVERY_STARTED',

  /**
   * Workflow currently under repair.
   */
  RECOVERING = 'RECOVERING',

  /**
   * Workflow successfully repaired.
   */
  RECOVERED = 'RECOVERED',

  /**
   * Automatic repair in progress.
   */
  REPAIRING = 'REPAIRING',

  /**
   * Workflow repair completed.
   */
  REPAIRED = 'REPAIRED',

  // ==================================================
  // ⚠️ ANOMALY / STALE STATES
  // ==================================================

  /**
   * Workflow appears frozen/stale.
   */
  STALE = 'STALE',

  /**
   * Workflow became inconsistent.
   */
  INCONSISTENT = 'INCONSISTENT',

  /**
   * Duplicate processing detected.
   */
  DUPLICATE_DETECTED = 'DUPLICATE_DETECTED',

  /**
   * Lock conflict detected.
   */
  LOCKED = 'LOCKED',

  // ==================================================
  // ❌ FAILURE STATES
  // ==================================================

  /**
   * Workflow failed unexpectedly.
   */
  FAILED = 'FAILED',

  /**
   * Workflow timed out.
   */
  TIMEOUT = 'TIMEOUT',

  /**
   * Workflow manually cancelled.
   */
  CANCELLED = 'CANCELLED',

  /**
   * Protection system blocked workflow.
   */
  BLOCKED = 'BLOCKED',

  // ==================================================
  // ✅ TERMINAL STATES
  // ==================================================

  /**
   * Workflow completed successfully.
   */
  COMPLETED = 'COMPLETED',

  /**
   * Workflow archived/closed.
   */
  CLOSED = 'CLOSED',
}