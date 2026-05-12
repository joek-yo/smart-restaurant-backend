// FILE: src/modules/payments/domain/entities/payment-ledger.entity.ts

import { PaymentProvider } from '../value-objects/provider.vo';
import { PaymentStatus } from '../value-objects/payment-status.vo';

/**
 * PaymentLedgerEntity
 * --------------------
 * IMMUTABLE financial audit record.
 *
 * PURPOSE:
 * - Full traceability of all payment lifecycle events
 * - Reconciliation source of truth
 * - Fraud detection & dispute resolution
 *
 * RULES:
 * - NEVER updated after creation
 * - NEVER deleted
 * - ALWAYS append-only
 */

export enum LedgerEventType {
  INITIATED = 'INITIATED',
  PROVIDER_SENT = 'PROVIDER_SENT',
  PROVIDER_CALLBACK_RECEIVED = 'PROVIDER_CALLBACK_RECEIVED',

  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',

  RECONCILED = 'RECONCILED',
  REFUNDED = 'REFUNDED',
}

export interface PaymentLedgerProps {
  id: string;

  // 🔗 CORE LINKS
  paymentId: string;
  paymentAttemptId?: string;

  // 🔐 TENANT ISOLATION
  tenantId: string;

  // 🏦 PROVIDER CONTEXT
  provider: PaymentProvider;

  // 💰 FINANCIAL SNAPSHOT (FREEZE IN TIME)
  amount: number;
  currency: string;

  // 📊 STATE AT TIME OF EVENT
  status: PaymentStatus;

  // 🧾 EVENT DETAILS
  eventType: LedgerEventType;

  // 🌐 PROVIDER RAW DATA (NEVER TRUSTED, JUST STORED)
  providerReference?: string;
  providerPayload?: Record<string, any>;

  // 📅 TIMESTAMP (IMMUTABLE)
  createdAt: Date;

  // 👤 ACTOR (SYSTEM / PROVIDER / USER)
  actor: 'SYSTEM' | 'PROVIDER' | 'USER';

  // 🔍 CONTEXT (optional trace debugging)
  metadata?: Record<string, any>;
}

export class PaymentLedgerEntity {
  private readonly props: PaymentLedgerProps;

  constructor(props: PaymentLedgerProps) {
    this.props = props;

    this.assertInvariants();
  }

  // =====================================================
  // 🔐 GETTERS (READ ONLY)
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

  get eventType() {
    return this.props.eventType;
  }

  get amount() {
    return this.props.amount;
  }

  get currency() {
    return this.props.currency;
  }

  get providerReference() {
    return this.props.providerReference;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  // =====================================================
  // 🧠 FACTORY METHODS (ENSURE CONSISTENCY)
  // =====================================================

  static initiate(input: Omit<PaymentLedgerProps, 'eventType'>): PaymentLedgerEntity {
    return new PaymentLedgerEntity({
      ...input,
      eventType: LedgerEventType.INITIATED,
      createdAt: new Date(),
    });
  }

  static providerSent(input: Omit<PaymentLedgerProps, 'eventType'>): PaymentLedgerEntity {
    return new PaymentLedgerEntity({
      ...input,
      eventType: LedgerEventType.PROVIDER_SENT,
      createdAt: new Date(),
    });
  }

  static providerCallback(input: Omit<PaymentLedgerProps, 'eventType'>): PaymentLedgerEntity {
    return new PaymentLedgerEntity({
      ...input,
      eventType: LedgerEventType.PROVIDER_CALLBACK_RECEIVED,
      createdAt: new Date(),
    });
  }

  static confirmed(input: Omit<PaymentLedgerProps, 'eventType'>): PaymentLedgerEntity {
    return new PaymentLedgerEntity({
      ...input,
      eventType: LedgerEventType.CONFIRMED,
      createdAt: new Date(),
    });
  }

  static failed(input: Omit<PaymentLedgerProps, 'eventType'>): PaymentLedgerEntity {
    return new PaymentLedgerEntity({
      ...input,
      eventType: LedgerEventType.FAILED,
      createdAt: new Date(),
    });
  }

  static reconciled(input: Omit<PaymentLedgerProps, 'eventType'>): PaymentLedgerEntity {
    return new PaymentLedgerEntity({
      ...input,
      eventType: LedgerEventType.RECONCILED,
      createdAt: new Date(),
    });
  }

  static refunded(input: Omit<PaymentLedgerProps, 'eventType'>): PaymentLedgerEntity {
    return new PaymentLedgerEntity({
      ...input,
      eventType: LedgerEventType.REFUNDED,
      createdAt: new Date(),
    });
  }

  // =====================================================
  // 🔐 RULES (IMMUTABILITY ENFORCEMENT)
  // =====================================================

  private assertInvariants(): void {
    if (!this.props.paymentId) {
      throw new Error('Ledger entry must have paymentId');
    }

    if (!this.props.tenantId) {
      throw new Error('Ledger entry must have tenantId');
    }

    if (this.props.amount <= 0) {
      throw new Error('Ledger amount must be > 0');
    }

    if (!this.props.currency) {
      throw new Error('Ledger must have currency');
    }

    if (!this.props.eventType) {
      throw new Error('Ledger must have eventType');
    }

    if (!this.props.createdAt) {
      throw new Error('Ledger must have timestamp');
    }
  }

  // =====================================================
  // 📤 SNAPSHOT (FOR DATABASE STORAGE ONLY)
  // =====================================================

  toPersistence(): PaymentLedgerProps {
    return { ...this.props };
  }
}