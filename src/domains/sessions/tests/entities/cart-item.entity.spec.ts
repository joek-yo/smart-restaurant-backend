// src/domains/sessions/tests/entities/cart-item.entity.spec.ts

import { CartItemEntity } from '../../../entities/cart-item.entity';

describe('CartItemEntity', () => {
  let cartItem: CartItemEntity;

  beforeEach(() => {
    cartItem = new CartItemEntity({
      productId: 'p1',
      name: 'Pizza',
      quantity: 2,
      price: 10,
      options: { size: 'M' },
    });
  });

  it('should initialize correctly', () => {
    expect(cartItem.productId).toBe('p1');
    expect(cartItem.name).toBe('Pizza');
    expect(cartItem.quantity).toBe(2);
    expect(cartItem.price).toBe(10);
    expect(cartItem.options).toEqual({ size: 'M' });
  });

  it('should calculate total correctly', () => {
    expect(cartItem.total).toBe(20);
  });

  it('should update quantity', () => {
    cartItem.updateQuantity(5);
    expect(cartItem.quantity).toBe(5);
  });

  it('should throw error if quantity <= 0', () => {
    expect(() => cartItem.updateQuantity(0)).toThrow('Quantity must be at least 1');
  });

  it('should update options correctly', () => {
    cartItem.updateOptions({ extraCheese: true });
    expect(cartItem.options).toEqual({ size: 'M', extraCheese: true });
  });
});