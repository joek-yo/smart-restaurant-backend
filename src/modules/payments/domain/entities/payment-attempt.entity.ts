// FILE: src/modules/payments/domain/entities/payment-attempt.entity.ts

import { PaymentProvider } from '../value-objects/provider.vo';

/**
 * PaymentAttemptEntity
 * ---------------------
 * Tracks EACH interaction with a payment provider.
 *
 * Examples:
 * - Mpesa STK Push attempt
 * - Stripe payment intent retry
 * - Aggregator fallback retry
 *
 * PURPOSE:
 * - Prevent duplicate charges
 * - Enable retry logic
 * - Debug failed payments
 * - Handle timeout + webhook ambiguity
 */

export enum PaymentAttemptStatus {
  STARTED = 'STARTED',
  SENT_TO_PROVIDER = 'SENT_TO_PROVIDER',
  TIMEOUT = 'TIMEOUT',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export interface PaymentAttemptProps {
  id: string;

  // 🔗 LINK TO CORE PAYMENT
  paymentId: string;
  tenantId: string;

  // 🏦 PROVIDER CONTEXT
  provider: PaymentProvider;

  // 🔁 ATTEMPT TRACKING
  attemptNumber: number;

  // 🌐 PROVIDER RESPONSE DATA
  providerReference?: string; // STK Push ID / Stripe Intent ID
  providerResponse?: Record<string, any>;

  // ⏱ TIMING
  startedAt: Date;
  finishedAt?: Date;
  timeoutAt?: Date;

  // 📊 STATUS
  status: PaymentAttemptStatus;

  // ❌ FAILURE INFO
  failureReason?: string;

  // 🔄 RETRY CONTROL
  isRetryable: boolean;
}

export class PaymentAttemptEntity {
  private props: PaymentAttemptProps;

  constructor(props: PaymentAttemptProps) {
    this.props = props;

    this.assertInvariants();
  }

  // =====================================================
  // 🔐 GETTERS
  // =====================================================

  get id() {
    return this.props.id;
  }

  get paymentId() {
    return this.props.paymentId;
  }

  get tenantId() {
    return this.props.tenantId;
  }

  get provider() {
    return this.props.provider;
  }

  get attemptNumber() {
    return this.props.attemptNumber;
  }

  get status() {
    return this.props.status;
  }

  get providerReference() {
    return this.props.providerReference;
  }

  get isRetryable() {
    return this.props.isRetryable;
  }

  // =====================================================
  // 🚀 DOMAIN BEHAVIOR
  // =====================================================

  markSent(providerReference: string, response?: any): void {
    this.ensureActive();

    this.props.status = PaymentAttemptStatus.SENT_TO_PROVIDER;
    this.props.providerReference = providerReference;
    this.props.providerResponse = response;
  }

  markSuccess(): void {
    this.ensureActive();

    this.props.status = PaymentAttemptStatus.SUCCESS;
    this.finish();
  }

  markFailed(reason: string): void {
    this.ensureActive();

    this.props.status = PaymentAttemptStatus.FAILED;
    this.props.failureReason = reason;
    this.finish();
  }

  markTimeout(): void {
    this.ensureActive();

    this.props.status = PaymentAttemptStatus.TIMEOUT;
    this.props.failureReason = 'Provider timeout';
    this.finish();
  }

  // =====================================================
  // 🧠 RETRY LOGIC
  // =====================================================

  canRetry(): boolean {
    return (
      this.props.isRetryable &&
      this.props.status !== PaymentAttemptStatus.SUCCESS
    );
  }

  incrementAttempt(nextAttemptNumber: number): PaymentAttemptEntity {
    if (!this.canRetry()) {
      throw new Error('Attempt is not retryable');
    }

    return new PaymentAttemptEntity({
      ...this.props,
      id: `${this.props.paymentId}-attempt-${nextAttemptNumber}`,
      attemptNumber: nextAttemptNumber,
      status: PaymentAttemptStatus.STARTED,
      startedAt: new Date(),
      finishedAt: undefined,
      providerReference: undefined,
      providerResponse: undefined,
      failureReason: undefined,
    });
  }

  // =====================================================
  // ⏱ INTERNAL HELPERS
  // =====================================================

  private finish(): void {
    this.props.finishedAt = new Date();
  }

  private ensureActive(): void {
    if (this.props.finishedAt) {
      throw new Error('Cannot modify a finished attempt');
    }
  }

  private assertInvariants(): void {
    if (!this.props.paymentId) {
      throw new Error('PaymentAttempt must have paymentId');
    }

    if (this.props.attemptNumber < 1) {
      throw new Error('Attempt number must start from 1');
    }

    if (!this.props.provider) {
      throw new Error('Provider is required');
    }
  }

  // =====================================================
  // 📤 SNAPSHOT FOR PERSISTENCE
  // =====================================================

  toPersistence(): PaymentAttemptProps {
    return { ...this.props };
  }
}