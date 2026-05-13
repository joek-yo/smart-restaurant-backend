// src/modules/protection/domain/value-objects/workflow-trace-id.vo.ts

/**
 * WorkflowTraceIdVO
 * ------------------
 * Global correlation identifier for a single end-to-end workflow.
 *
 * Used to trace:
 * - conversation → checkout → payment → order
 * - recovery flows
 * - repair pipelines
 * - distributed logs & observability
 *
 * RULES:
 * - Must be globally unique
 * - Must be immutable
 * - Must persist across all workflow stages
 */
export class WorkflowTraceIdVO {
  private readonly value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('WorkflowTraceIdVO cannot be empty');
    }

    this.value = value;
  }

  // ─────────────────────────────────────────────
  // 🔑 ACCESS
  // ─────────────────────────────────────────────

  getValue(): string {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  // ─────────────────────────────────────────────
  // 🧠 FACTORY METHODS
  // ─────────────────────────────────────────────

  /**
   * Create trace ID from conversation entry point
   */
  static forConversation(
    tenantId: string,
    userId: string,
  ): WorkflowTraceIdVO {
    return new WorkflowTraceIdVO(
      `trace:conversation:${tenantId}:${userId}:${Date.now()}`,
    );
  }

  /**
   * Create trace ID from checkout flow
   */
  static forCheckout(
    tenantId: string,
    sessionId: string,
  ): WorkflowTraceIdVO {
    return new WorkflowTraceIdVO(
      `trace:checkout:${tenantId}:${sessionId}:${Date.now()}`,
    );
  }

  /**
   * Create trace ID for payment flow
   */
  static forPayment(
    tenantId: string,
    paymentId: string,
  ): WorkflowTraceIdVO {
    return new WorkflowTraceIdVO(
      `trace:payment:${tenantId}:${paymentId}:${Date.now()}`,
    );
  }

  /**
   * Create trace ID for order flow
   */
  static forOrder(
    tenantId: string,
    orderId: string,
  ): WorkflowTraceIdVO {
    return new WorkflowTraceIdVO(
      `trace:order:${tenantId}:${orderId}:${Date.now()}`,
    );
  }

  /**
   * Create a fully generic trace (fallback / recovery systems)
   */
  static generate(): WorkflowTraceIdVO {
    return new WorkflowTraceIdVO(
      `trace:${Date.now()}:${Math.random().toString(36).substring(2, 10)}`,
    );
  }

  // ─────────────────────────────────────────────
  // 🔍 COMPARISON
  // ─────────────────────────────────────────────

  equals(other: WorkflowTraceIdVO): boolean {
    return this.value === other.value;
  }
}