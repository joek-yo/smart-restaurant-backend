// src/domains/sessions/tests/entities/session.entity.spec.ts

import { SessionEntity } from '../../../entities/session.entity';
import { CartItemEntity } from '../../../entities/cart-item.entity';
import { DiscountVO } from '../../../value-objects/discount.vo';
import { SessionState } from '../../../value-objects/session-state.vo';

describe('SessionEntity', () => {
  let session: SessionEntity;

  beforeEach(() => {
    session = new SessionEntity({ userId: 'user-123' });
  });

  it('should initialize with empty items and default state', () => {
    expect(session.items).toHaveLength(0);
    expect(session.state.value).toBe(SessionState.START);
  });

  it('should add a new item', () => {
    const item = new CartItemEntity({
      productId: 'p1',
      name: 'Pizza',
      quantity: 2,
      price: 10,
    });

    session.addItem(item);

    expect(session.items).toHaveLength(1);
    expect(session.items[0].productId).toBe('p1');
    expect(session.state.value).toBe(SessionState.CART_UPDATED);
  });

  it('should increase quantity if same product added again', () => {
    session.addItem(
      new CartItemEntity({
        productId: 'p1',
        name: 'Pizza',
        quantity: 2,
        price: 10,
      }),
    );

    session.addItem(
      new CartItemEntity({
        productId: 'p1',
        name: 'Pizza',
        quantity: 3,
        price: 10,
      }),
    );

    expect(session.items).toHaveLength(1);
    expect(session.items[0].quantity).toBe(5);
  });

  it('should remove an item', () => {
    session.addItem(
      new CartItemEntity({
        productId: 'p1',
        name: 'Pizza',
        quantity: 2,
        price: 10,
      }),
    );

    session.removeItem('p1');

    expect(session.items).toHaveLength(0);
    expect(session.state.value).toBe(SessionState.BROWSING_MENU);
  });

  it('should update quantity', () => {
    session.addItem(
      new CartItemEntity({
        productId: 'p1',
        name: 'Pizza',
        quantity: 2,
        price: 10,
      }),
    );

    session.updateQuantity('p1', 5);

    expect(session.items[0].quantity).toBe(5);
    expect(session.state.value).toBe(SessionState.CART_UPDATED);
  });

  it('should apply discount', () => {
    session.addItem(
      new CartItemEntity({
        productId: 'p1',
        name: 'Pizza',
        quantity: 2,
        price: 10,
      }),
    );

    const discount = new DiscountVO({ type: 'FIXED', value: 5 });
    session.applyDiscount(discount);

    expect(session.discount).toBeDefined();
    expect(session.discount?.apply(20)).toBe(15);
  });

  it('should calculate total with discount', () => {
    session.addItem(
      new CartItemEntity({
        productId: 'p1',
        name: 'Pizza',
        quantity: 2,
        price: 10,
      }),
    );

    session.addItem(
      new CartItemEntity({
        productId: 'p2',
        name: 'Soda',
        quantity: 1,
        price: 5,
      }),
    );

    const discount = new DiscountVO({ type: 'PERCENTAGE', value: 10 });
    session.applyDiscount(discount);

    expect(session.totalAmount).toBeCloseTo(22.5);
  });

  it('should checkout', () => {
    session.addItem(
      new CartItemEntity({
        productId: 'p1',
        name: 'Pizza',
        quantity: 1,
        price: 10,
      }),
    );

    session.checkout();

    expect(session.state.value).toBe(SessionState.CHECKOUT);
  });

  it('should throw error if checkout with empty cart', () => {
    expect(() => session.checkout()).toThrow('Cart is empty');
  });

  it('should expire the session', () => {
    session.expire();

    expect(session.state.value).toBe(SessionState.EXPIRED);
  });
});