// FILE: src/modules/payments/domain/value-objects/payment-status.vo.ts

/**
 * PaymentStatusVO
 * ----------------
 * Strict lifecycle state machine for all payments.
 *
 * RULES:
 * - Payments MUST follow valid transitions
 * - No skipping states
 * - Provider (Mpesa/Stripe/etc) cannot directly mutate final states
 */

export enum PaymentStatus {
  CREATED = 'CREATED',

  // Payment has been sent to provider (Mpesa STK push, Stripe intent, etc.)
  INITIATED = 'INITIATED',

  // Waiting for provider callback / user action
  PENDING_PROVIDER = 'PENDING_PROVIDER',

  // Successfully confirmed by provider
  CONFIRMED = 'CONFIRMED',

  // Payment failed at provider level
  FAILED = 'FAILED',

  // Reconciliation completed (ledger matched, system verified)
  RECONCILED = 'RECONCILED',

  // Money returned to customer
  REFUNDED = 'REFUNDED',
}

/**
 * Value Object wrapper (future-proofing for invariants)
 */
export class PaymentStatusVO {
  private readonly _value: PaymentStatus;

  constructor(value: PaymentStatus) {
    if (!Object.values(PaymentStatus).includes(value)) {
      throw new Error(`Invalid PaymentStatus: ${value}`);
    }

    this._value = value;
  }

  get value(): PaymentStatus {
    return this._value;
  }

  // =====================================================
  // 🧠 STATE TRANSITION RULES (STRICT)
  // =====================================================
  canTransitionTo(next: PaymentStatus): boolean {
    const transitions: Record<PaymentStatus, PaymentStatus[]> = {
      [PaymentStatus.CREATED]: [PaymentStatus.INITIATED],

      [PaymentStatus.INITIATED]: [PaymentStatus.PENDING_PROVIDER, PaymentStatus.FAILED],

      [PaymentStatus.PENDING_PROVIDER]: [
        PaymentStatus.CONFIRMED,
        PaymentStatus.FAILED,
      ],

      [PaymentStatus.CONFIRMED]: [
        PaymentStatus.RECONCILED,
        PaymentStatus.REFUNDED,
      ],

      [PaymentStatus.FAILED]: [],
      [PaymentStatus.RECONCILED]: [],
      [PaymentStatus.REFUNDED]: [],
    };

    return transitions[this._value].includes(next);
  }

  transition(next: PaymentStatus): PaymentStatusVO {
    if (!this.canTransitionTo(next)) {
      throw new Error(
        `Invalid payment transition: ${this._value} → ${next}`,
      );
    }

    return new PaymentStatusVO(next);
  }

  isFinal(): boolean {
    return (
      this._value === PaymentStatus.RECONCILED ||
      this._value === PaymentStatus.REFUNDED ||
      this._value === PaymentStatus.FAILED
    );
  }
}