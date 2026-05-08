/**
 * FILE: src/modules/checkout/domain/value-objects/checkout-status.vo.ts
 *
 * 🧾 Checkout Status Value Object
 * --------------------------------
 * Defines STRICT lifecycle of checkout process.
 * Prevents invalid state transitions at domain level.
 */

export enum CheckoutStatus {
  CART_BUILDING = 'CART_BUILDING',
  READY_TO_CHECKOUT = 'READY_TO_CHECKOUT',
  CHECKOUT_STARTED = 'CHECKOUT_STARTED',
  VALIDATING = 'VALIDATING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

export class CheckoutStatusVO {
  private readonly status: CheckoutStatus;

  constructor(status: CheckoutStatus = CheckoutStatus.CART_BUILDING) {
    this.status = status;
  }

  get value(): CheckoutStatus {
    return this.status;
  }

  is(status: CheckoutStatus): boolean {
    return this.status === status;
  }

  canTransitionTo(next: CheckoutStatus): boolean {
    const map: Record<CheckoutStatus, CheckoutStatus[]> = {
      CART_BUILDING: [CheckoutStatus.READY_TO_CHECKOUT],
      READY_TO_CHECKOUT: [CheckoutStatus.CHECKOUT_STARTED],
      CHECKOUT_STARTED: [CheckoutStatus.VALIDATING, CheckoutStatus.CANCELLED],
      VALIDATING: [CheckoutStatus.CONFIRMED, CheckoutStatus.FAILED],
      CONFIRMED: [],
      CANCELLED: [],
      FAILED: [CheckoutStatus.CHECKOUT_STARTED],
    };

    return map[this.status]?.includes(next) ?? false;
  }

  transition(next: CheckoutStatus): CheckoutStatusVO {
    if (!this.canTransitionTo(next)) {
      throw new Error(
        `Invalid checkout transition: ${this.status} → ${next}`,
      );
    }

    return new CheckoutStatusVO(next);
  }
}
