// src/modules/smartpage/tests/cart-integration.spec.ts

import { Test } from '@nestjs/testing';

import { CartSyncService } from '../application/cart-integration/cart-sync.service';
import { CartContextMapper } from '../application/cart-integration/cart-context.mapper';

/**
 * CART INTEGRATION TEST
 * -----------------------------------------------------
 * Validates:
 * - session → cart → smartpage sync correctness
 * - cart context mapping integrity
 * - real-time update propagation
 * - safe fallback when session/cart missing
 */

describe('Cart Integration (Session ↔ SmartPage)', () => {
  let cartSync: CartSyncService;
  let mapper: CartContextMapper;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        CartSyncService,
        CartContextMapper,
      ],
    }).compile();

    cartSync = moduleRef.get(CartSyncService);
    mapper = moduleRef.get(CartContextMapper);
  });

  it('should map session to smartpage cart context correctly', () => {
    const session = {
      userId: 'user_1',
      tenantId: 'tenant_1',
      cart: {
        items: [
          { id: 'p1', name: 'Shoes', price: 100, quantity: 2 },
        ],
      },
    };

    const result = mapper.mapSessionToCartContext(session as any);

    expect(result.userId).toBe('user_1');
    expect(result.tenantId).toBe('tenant_1');
    expect(result.items.length).toBe(1);
    expect(result.total).toBe(200);
  });

  it('should return empty cart context when session has no cart', () => {
    const session = {
      userId: 'user_2',
      tenantId: 'tenant_1',
    };

    const result = mapper.mapSessionToCartContext(session as any);

    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('should sync cart updates to SmartPage runtime state', async () => {
    const payload = {
      userId: 'user_1',
      tenantId: 'tenant_1',
      item: { id: 'p2', name: 'Bag', price: 50, quantity: 1 },
    };

    const result = await cartSync.syncAddItem(payload);

    expect(result).toBeDefined();
    expect(result.status).toBe('SYNCED');
  });

  it('should handle cart removal updates correctly', async () => {
    const payload = {
      userId: 'user_1',
      tenantId: 'tenant_1',
      itemId: 'p2',
    };

    const result = await cartSync.syncRemoveItem(payload);

    expect(result).toBeDefined();
    expect(result.status).toBe('SYNCED');
  });

  it('should not crash when session is missing', () => {
    const result = mapper.mapSessionToCartContext(undefined as any);

    expect(result).toBeDefined();
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('should keep cart state consistent after multiple updates', async () => {
    await cartSync.syncAddItem({
      userId: 'user_1',
      tenantId: 'tenant_1',
      item: { id: 'p1', name: 'Shoes', price: 100, quantity: 1 },
    });

    await cartSync.syncAddItem({
      userId: 'user_1',
      tenantId: 'tenant_1',
      item: { id: 'p1', name: 'Shoes', price: 100, quantity: 1 },
    });

    const state = await cartSync.getCartState({
      userId: 'user_1',
      tenantId: 'tenant_1',
    });

    expect(state.items.length).toBeGreaterThan(0);
    expect(state.total).toBeGreaterThan(0);
  });
});