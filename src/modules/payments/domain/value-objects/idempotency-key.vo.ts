// src/modules/payments/domain/value-objects/idempotency-key.vo.ts

/**
 * IdempotencyKeyVO
 * -----------------
 * PURPOSE:
 * Ensures that repeated requests (due to retries, network issues, or user double-clicks)
 * do NOT create duplicate payments or side effects.
 *
 * CORE PROTECTION:
 * - Prevents double checkout submissions
 * - Prevents retry storms from creating multiple payments
 * - Prevents webhook replay from re-triggering business logic
 *
 * RULE:
 * Same idempotency key + same context = SAME result always
 */

export class IdempotencyKeyVO {
  private constructor(private readonly value: string) {}

  /**
   * Factory method to create a validated idempotency key
   */
  static create(value: string): IdempotencyKeyVO {
    if (!value) {
      throw new Error('Idempotency key cannot be empty');
    }

    const normalized = value.trim();

    if (normalized.length < 10) {
      throw new Error('Idempotency key too short (min 10 chars)');
    }

    if (normalized.length > 128) {
      throw new Error('Idempotency key too long (max 128 chars)');
    }

    // Optional: enforce safe characters only
    const safePattern = /^[a-zA-Z0-9._-]+$/;
    if (!safePattern.test(normalized)) {
      throw new Error('Invalid idempotency key format');
    }

    return new IdempotencyKeyVO(normalized);
  }

  /**
   * Returns raw value
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Used for comparisons in repositories / guards
   */
  equals(other: IdempotencyKeyVO): boolean {
    return this.value === other.value;
  }

  /**
   * Useful for logs / tracing
   */
  toString(): string {
    return this.value;
  }
}