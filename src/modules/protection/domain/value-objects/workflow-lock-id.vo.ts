// src/modules/protection/domain/value-objects/workflow-lock-id.vo.ts

/**
 * WorkflowLockIdVO
 * -----------------
 * Strongly-typed identifier for distributed workflow locks.
 *
 * RULES:
 * - Must always be tenant-scoped
 * - Must always include workflow type
 * - Must always include entity identity
 *
 * Prevents:
 * - cross-tenant collisions
 * - unsafe string-based lock keys
 * - ambiguous lock ownership
 */
export class WorkflowLockIdVO {
  private readonly value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('WorkflowLockIdVO cannot be empty');
    }

    this.value = value;
  }

  /**
   * Raw value (used only by infrastructure layer)
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Factory: session lock
   */
  static forSession(tenantId: string, sessionId: string): WorkflowLockIdVO {
    return new WorkflowLockIdVO(`session:${tenantId}:${sessionId}`);
  }

  /**
   * Factory: checkout lock
   */
  static forCheckout(tenantId: string, checkoutId: string): WorkflowLockIdVO {
    return new WorkflowLockIdVO(`checkout:${tenantId}:${checkoutId}`);
  }

  /**
   * Factory: payment lock
   */
  static forPayment(tenantId: string, paymentId: string): WorkflowLockIdVO {
    return new WorkflowLockIdVO(`payment:${tenantId}:${paymentId}`);
  }

  /**
   * Factory: order lock
   */
  static forOrder(tenantId: string, orderId: string): WorkflowLockIdVO {
    return new WorkflowLockIdVO(`order:${tenantId}:${orderId}`);
  }

  /**
   * Factory: conversation lock
   */
  static forConversation(tenantId: string, userId: string): WorkflowLockIdVO {
    return new WorkflowLockIdVO(`conversation:${tenantId}:${userId}`);
  }

  /**
   * Compare two lock IDs safely
   */
  equals(other: WorkflowLockIdVO): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}