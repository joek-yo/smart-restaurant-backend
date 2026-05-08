/**
 * FILE: src/modules/checkout/domain/value-objects/money.vo.ts
 *
 * 💰 Money Value Object
 * ----------------------
 * Immutable representation of money.
 * Prevents floating-point errors in pricing logic.
 */

export class MoneyVO {
  private readonly amount: number;
  private readonly currency: string;

  constructor(amount: number, currency: string = 'KES') {
    if (amount < 0) {
      throw new Error('Money cannot be negative');
    }

    this.amount = Math.round(amount * 100) / 100; // precision safety
    this.currency = currency;
  }

  get value(): number {
    return this.amount;
  }

  get curr(): string {
    return this.currency;
  }

  add(money: MoneyVO): MoneyVO {
    this.assertSameCurrency(money);
    return new MoneyVO(this.amount + money.amount, this.currency);
  }

  subtract(money: MoneyVO): MoneyVO {
    this.assertSameCurrency(money);
    return new MoneyVO(this.amount - money.amount, this.currency);
  }

  multiply(factor: number): MoneyVO {
    return new MoneyVO(this.amount * factor, this.currency);
  }

  equals(money: MoneyVO): boolean {
    return this.amount === money.amount && this.currency === money.currency;
  }

  private assertSameCurrency(money: MoneyVO) {
    if (money.currency !== this.currency) {
      throw new Error('Currency mismatch');
    }
  }
}
