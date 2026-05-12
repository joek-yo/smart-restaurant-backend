// FILE: src/modules/payments/domain/value-objects/money.vo.ts

/**
 * 💰 Money Value Object
 * ---------------------
 * CORE FINANCIAL SAFETY LAYER
 *
 * RULES:
 * - NEVER use floating point for money
 * - ALWAYS store in smallest currency unit (e.g. cents)
 * - IMMUTABLE
 * - SAFE FOR GLOBAL CURRENCIES (KES, USD, EUR, etc.)
 */

export class MoneyVO {
  private readonly amountInMinorUnit: number; // e.g. cents
  private readonly currency: string;

  constructor(amount: number, currency: string = 'KES') {
    if (amount < 0) {
      throw new Error('Money cannot be negative');
    }

    if (!currency || currency.length !== 3) {
      throw new Error('Invalid currency code');
    }

    /**
     * 🔐 Convert major unit → minor unit
     * Example:
     * 100.50 KES → 10050 (cents equivalent)
     */
    this.amountInMinorUnit = Math.round(amount * 100);
    this.currency = currency.toUpperCase();
  }

  // =========================
  // GETTERS
  // =========================

  get amount(): number {
    return this.amountInMinorUnit / 100;
  }

  get minor(): number {
    return this.amountInMinorUnit;
  }

  get curr(): string {
    return this.currency;
  }

  // =========================
  // DOMAIN OPERATIONS
  // =========================

  add(other: MoneyVO): MoneyVO {
    this.assertSameCurrency(other);

    return new MoneyVO(
      (this.amountInMinorUnit + other.amountInMinorUnit) / 100,
      this.currency,
    );
  }

  subtract(other: MoneyVO): MoneyVO {
    this.assertSameCurrency(other);

    const result = this.amountInMinorUnit - other.amountInMinorUnit;

    if (result < 0) {
      throw new Error('MoneyVO cannot go below zero');
    }

    return new MoneyVO(result / 100, this.currency);
  }

  multiply(factor: number): MoneyVO {
    if (factor < 0) {
      throw new Error('Multiplier cannot be negative');
    }

    return new MoneyVO(
      (this.amountInMinorUnit * factor) / 100,
      this.currency,
    );
  }

  equals(other: MoneyVO): boolean {
    return (
      this.amountInMinorUnit === other.amountInMinorUnit &&
      this.currency === other.currency
    );
  }

  // =========================
  // INTERNAL GUARDS
  // =========================

  private assertSameCurrency(other: MoneyVO) {
    if (this.currency !== other.currency) {
      throw new Error(
        `Currency mismatch: ${this.currency} vs ${other.currency}`,
      );
    }
  }

  // =========================
  // SERIALIZATION
  // =========================

  toJSON() {
    return {
      amount: this.amount,
      currency: this.currency,
      minor: this.amountInMinorUnit,
    };
  }
}