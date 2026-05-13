// FILE: src/modules/payments/domain/entities/payment.entity.ts

import { PaymentStatusVO, PaymentStatus } from '../value-objects/payment-status.vo';
import { ProviderVO, PaymentProvider } from '../value-objects/provider.vo';

/**
 * PaymentEntity
 * --------------
 * SOURCE OF TRUTH for all money movement in the system.
 *
 * RULES:
 * - Never trust provider state directly
 * - All transitions must go through domain rules
 * - Tenant isolation is mandatory
 * - Immutable history via attempts/ledger (future phases)
 */

export interface PaymentProps {
  id: string;

  // 🔐 MULTI-TENANCY CORE
  tenantId: string;

  // 👤 CUSTOMER CONTEXT
  customerId: string;
  orderId?: string;

  // 💰 FINANCIAL CONTEXT
  amount: number;
  currency: string; // "KES", "USD", etc (future global expansion)

  // 🏦 PROVIDER
  provider: ProviderVO;

  // 🔄 STATE
  status: PaymentStatusVO;

  // 🧠 PROVIDER REFERENCES
  providerReference?: string; // e.g. Mpesa CheckoutRequestID, Stripe Intent ID

  // 🔁 TRACKING
  retries?: number;

  // 📅 TIMESTAMPS
  createdAt: Date;
  updatedAt: Date;
}

export class PaymentEntity {
  private props: PaymentProps;

  constructor(props: PaymentProps) {
    this.props = {
      ...props,
      retries: props.retries ?? 0,
    };

    this.assertInvariants();
  }

  // =====================================================
  // 🔐 GETTERS (NO DIRECT MUTATION ACCESS)
  // =====================================================

  get id() {
    return this.props.id;
  }

  get tenantId() {
    return this.props.tenantId;
  }

  get customerId() {
    return this.props.customerId;
  }

  get orderId() {
    return this.props.orderId;
  }

  get amount() {
    return this.props.amount;
  }

  get currency() {
    return this.props.currency;
  }

  get provider() {
    return this.props.provider;
  }

  get status() {
    return this.props.status;
  }

  get providerReference() {
    return this.props.providerReference;
  }

  get retries() {
    return this.props.retries ?? 0;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  // =====================================================
  // 🧠 DOMAIN BEHAVIOR
  // =====================================================

  initiate(providerRef: string): void {
    this.ensureState(PaymentStatus.CREATED);

    this.props.status = this.props.status.transition(
      PaymentStatus.INITIATED,
    );

    this.props.providerReference = providerRef;
    this.touch();
  }

  markPendingProvider(): void {
    this.ensureState(PaymentStatus.INITIATED);

    this.props.status = this.props.status.transition(
      PaymentStatus.PENDING_PROVIDER,
    );

    this.touch();
  }

  markConfirmed(): void {
    this.ensureAllowed([
      PaymentStatus.PENDING_PROVIDER,
      PaymentStatus.INITIATED,
    ]);

    this.props.status = this.props.status.transition(
      PaymentStatus.CONFIRMED,
    );

    this.touch();
  }

  markFailed(reason?: string): void {
    this.ensureNotFinal();

    this.props.status = this.props.status.transition(
      PaymentStatus.FAILED,
    );

    this.props.retries = this.retries + 1;

    this.touch();
  }

  reconcile(): void {
    if (this.status.value !== PaymentStatus.CONFIRMED) {
      throw new Error('Only confirmed payments can be reconciled');
    }

    this.props.status = this.props.status.transition(
      PaymentStatus.RECONCILED,
    );

    this.touch();
  }

  refund(): void {
    if (this.status.value !== PaymentStatus.CONFIRMED) {
      throw new Error('Only confirmed payments can be refunded');
    }

    this.props.status = this.props.status.transition(
      PaymentStatus.REFUNDED,
    );

    this.touch();
  }

  // =====================================================
  // 🧠 BUSINESS RULE GUARDS
  // =====================================================

  private ensureState(expected: PaymentStatus): void {
    if (this.status.value !== expected) {
      throw new Error(
        `Invalid state. Expected ${expected}, got ${this.status.value}`,
      );
    }
  }

  private ensureAllowed(allowed: PaymentStatus[]): void {
    if (!allowed.includes(this.status.value)) {
      throw new Error(
        `Invalid state transition from ${this.status.value}`,
      );
    }
  }

  private ensureNotFinal(): void {
    if (this.status.isFinal()) {
      throw new Error('Cannot modify a final payment state');
    }
  }

  private assertInvariants(): void {
    if (!this.props.tenantId) {
      throw new Error('Payment must have tenantId');
    }

    if (this.props.amount <= 0) {
      throw new Error('Payment amount must be greater than 0');
    }

    if (!this.props.currency) {
      throw new Error('Currency is required');
    }
  }

  touch(): void {
    this.props.updatedAt = new Date();
  }

  // =====================================================
  // 📤 SNAPSHOT (FOR REPOSITORY / PERSISTENCE)
  // =====================================================

  toPersistence(): PaymentProps {
    return {
      ...this.props,
    };
  }
}