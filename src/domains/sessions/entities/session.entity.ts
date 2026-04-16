// FILE: src/domains/sessions/entities/session.entity.ts

import { BaseEntity } from '../../../common/base.entity';
import { CartItemEntity } from './cart-item.entity';
import { SessionStateVO, SessionState } from '../value-objects/session-state.vo';
import { DiscountVO } from '../value-objects/discount.vo';

export class SessionEntity extends BaseEntity {
  id?: string;

  businessId!: string;
  branchId?: string;
  userId!: string;

  state: SessionStateVO = new SessionStateVO();
  items: CartItemEntity[] = [];
  discount?: DiscountVO;
  expiresAt?: Date;

  constructor(partial?: Partial<SessionEntity>) {
    super(partial);

    if (!partial) return;

    this.id = partial.id;
    this.businessId = partial.businessId!;
    this.branchId = partial.branchId;
    this.userId = partial.userId!;

    this.state = partial.state
      ? new SessionStateVO(partial.state.value)
      : new SessionStateVO();

    this.items = partial.items
      ? partial.items.map((i) => new CartItemEntity(i as any))
      : [];

    this.discount = partial.discount;
    this.expiresAt = partial.expiresAt;
  }

  // =========================
  // CART OPERATIONS
  // =========================

  addItem(item: CartItemEntity): SessionEntity {
    let found = false;

    const items = this.items.map((i) => {
      if (i.productId === item.productId) {
        found = true;

        return new CartItemEntity({
          ...i,
          quantity: i.quantity + item.quantity,
        });
      }

      return i;
    });

    if (!found) {
      items.push(item);
    }

    return this.clone({
      items,
      state: new SessionStateVO(SessionState.CART_UPDATED),
    });
  }

  removeItem(productId: string): SessionEntity {
    const items = this.items.filter(
      (i) => i.productId !== productId,
    );

    return this.clone({
      items,
      state: new SessionStateVO(
        items.length
          ? SessionState.CART_UPDATED
          : SessionState.BROWSING_MENU,
      ),
    });
  }

  updateQuantity(productId: string, quantity: number): SessionEntity {
    const exists = this.items.find(
      (i) => i.productId === productId,
    );

    if (!exists) throw new Error('Item not found');

    const items = this.items.map((i) => {
      if (i.productId === productId) {
        return new CartItemEntity({
          ...i,
          quantity,
        });
      }

      return i;
    });

    return this.clone({
      items,
      state: new SessionStateVO(SessionState.CART_UPDATED),
    });
  }

  // =========================
  // SESSION ACTIONS
  // =========================

  applyDiscount(discount: DiscountVO): SessionEntity {
    return this.clone({ discount });
  }

  reset(): SessionEntity {
    return this.clone({
      items: [],
      discount: undefined,
      state: new SessionStateVO(SessionState.BROWSING_MENU),
    });
  }

  checkout(): SessionEntity {
    if (this.items.length === 0) {
      throw new Error('Cart is empty');
    }

    return this.clone({
      state: new SessionStateVO(SessionState.CHECKOUT),
    });
  }

  expire(): SessionEntity {
    return this.clone({
      state: new SessionStateVO(SessionState.EXPIRED),
    });
  }

  // =========================
  // DERIVED VALUE
  // =========================

  get totalAmount(): number {
    const subtotal = this.items.reduce(
      (sum, i) => sum + i.total,
      0,
    );

    return this.discount
      ? this.discount.apply(subtotal)
      : subtotal;
  }

  // =========================
  // INTERNAL CLONE
  // =========================

  private clone(partial: Partial<SessionEntity>): SessionEntity {
    return new SessionEntity({
      ...this,
      ...partial,
    });
  }
}