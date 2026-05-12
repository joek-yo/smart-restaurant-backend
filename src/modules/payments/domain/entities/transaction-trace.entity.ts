// src/modules/payments/domain/entities/transaction-trace.entity.ts

/**
 * TransactionTrace Entity
 * ---------------------------------------------
 * Purpose:
 * - Stores full step-by-step execution history of a payment
 * - Acts like Stripe's "Payment Timeline"
 * - Enables debugging, audit, and observability at a deep level
 *
 * Each payment has multiple trace entries:
 * INITIATED → MPESA_REQUESTED → CALLBACK_RECEIVED → CONFIRMED → etc.
 */

export type TraceStage =
  | 'INITIATED'
  | 'IDEMPOTENCY_CHECK'
  | 'PROVIDER_SELECTED'
  | 'MPESA_REQUEST_SENT'
  | 'WEBHOOK_RECEIVED'
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_FAILED'
  | 'RECONCILED';

export class TransactionTrace {
  constructor(
    public readonly id: string,
    public readonly paymentId: string,
    public readonly stage: TraceStage,
    public readonly message: string,
    public readonly timestamp: Date = new Date(),
    public readonly metadata?: Record<string, any>,
  ) {}

  /**
   * Factory method for clean trace creation
   */
  static create(input: {
    paymentId: string;
    stage: TraceStage;
    message: string;
    metadata?: Record<string, any>;
  }) {
    return new TransactionTrace(
      cryptoRandomId(),
      input.paymentId,
      input.stage,
      input.message,
      new Date(),
      input.metadata,
    );
  }
}

/**
 * Simple ID generator (replace with UUID lib in production)
 */
function cryptoRandomId(): string {
  return (
    'trace_' +
    Math.random().toString(36).substring(2, 10) +
    Date.now().toString(36)
  );
}