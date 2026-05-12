// src/modules/payments/domain/entities/payment-idempotency.entity.ts

import { IdempotencyKeyVO } from '../value-objects/idempotency-key.vo';
import * as crypto from 'crypto';

export type PaymentIdempotencyProps = {
  id?: string;
  idempotencyKey: IdempotencyKeyVO;
  paymentId: string;

  context: 'checkout' | 'webhook' | 'refund' | 'reconciliation';

  metadata?: Record<string, any>;

  /**
   * 🔐 CRITICAL (NEW)
   * Deterministic fingerprint of request payload
   */
  requestHash: string;

  createdAt?: Date;
};

export class PaymentIdempotencyEntity {
  private constructor(private readonly props: PaymentIdempotencyProps) {}

  /**
   * =========================
   * 🔐 FACTORY (ENHANCED)
   * =========================
   */
  static create(
    props: Omit<PaymentIdempotencyProps, 'requestHash'> & {
      payload: Record<string, any>;
    },
  ): PaymentIdempotencyEntity {
    if (!props.idempotencyKey) {
      throw new Error('Idempotency key is required');
    }

    if (!props.paymentId) {
      throw new Error('Payment ID is required');
    }

    const requestHash = this.generateRequestHash({
      key: props.idempotencyKey.getValue(),
      context: props.context,
      payload: props.payload,
    });

    return new PaymentIdempotencyEntity({
      ...props,
      requestHash,
      createdAt: props.createdAt ?? new Date(),
    });
  }

  /**
   * =========================
   * 🔐 CORE HASH ENGINE
   * =========================
   */
  private static generateRequestHash(input: {
    key: string;
    context: string;
    payload: Record<string, any>;
  }): string {
    /**
     * STEP 1: Normalize payload (deterministic ordering)
     */
    const normalizedPayload = this.normalizeObject(input.payload);

    /**
     * STEP 2: Build stable string
     */
    const raw = JSON.stringify({
      key: input.key,
      context: input.context,
      payload: normalizedPayload,
    });

    /**
     * STEP 3: SHA-256 hash (immutable fingerprint)
     */
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  /**
   * 🔐 Deep deterministic object sorter
   */
  private static normalizeObject(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(this.normalizeObject);
    }

    return Object.keys(obj)
      .sort()
      .reduce((acc, key) => {
        acc[key] = this.normalizeObject(obj[key]);
        return acc;
      }, {} as Record<string, any>);
  }

  /**
   * =========================
   * CORE GETTERS
   * =========================
   */
  get id(): string | undefined {
    return this.props.id;
  }

  get idempotencyKey(): IdempotencyKeyVO {
    return this.props.idempotencyKey;
  }

  get paymentId(): string {
    return this.props.paymentId;
  }

  get context(): PaymentIdempotencyProps['context'] {
    return this.props.context;
  }

  get requestHash(): string {
    return this.props.requestHash;
  }

  get metadata(): Record<string, any> | undefined {
    return this.props.metadata;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  /**
   * =========================
   * BUSINESS LOGIC
   * =========================
   */

  matches(key: IdempotencyKeyVO, context: string): boolean {
    return (
      this.props.idempotencyKey.equals(key) &&
      this.props.context === context
    );
  }

  /**
   * Detect true replay (hash match)
   */
  isDuplicateRequest(hash: string): boolean {
    return this.props.requestHash === hash;
  }

  /**
   * =========================
   * DEBUG / AUDIT
   * =========================
   */
  toPrimitives() {
    return {
      id: this.props.id,
      idempotencyKey: this.props.idempotencyKey.getValue(),
      paymentId: this.props.paymentId,
      context: this.props.context,
      requestHash: this.props.requestHash,
      metadata: this.props.metadata,
      createdAt: this.props.createdAt,
    };
  }
}