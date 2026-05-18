// src/modules/smartpage/tests/cart-integration.spec.ts

import { CartContextMapper } from '../application/cart-integration/cart-context.mapper';
import { CartSyncService } from '../application/cart-integration/cart-sync.service';

// ─────────────────────────────────────────────────────────────
// CartContextMapper — pure function, no DI needed
// ─────────────────────────────────────────────────────────────
describe('CartContextMapper', () => {
  let mapper: CartContextMapper;

  beforeAll(() => {
    mapper = new CartContextMapper();
  });

  it('should map session with items to cart context', () => {
    const session = {
      id: 'session_1',
      cart: {
        items: [{ id: 'p1', name: 'Shoes', price: 100, quantity: 2 }],
      },
      updatedAt: new Date(),
    };

    const result = mapper.map(session);

    expect(result.cart).toBeDefined();
    expect(result.cart!.hasItems).toBe(true);
    expect(result.cart!.total).toBe(200);
    expect(result.cart!.items.length).toBe(1);
  });

  it('should return empty cart context when session has no cart', () => {
    const result = mapper.map({ id: 'session_2' });

    expect(result.cart!.hasItems).toBe(false);
    expect(result.cart!.isEmpty).toBe(true);
    expect(result.cart!.total).toBe(0);
  });

  it('should not crash when session is undefined', () => {
    const result = mapper.map(undefined);

    expect(result).toBeDefined();
    expect(result.cart!.items).toEqual([]);
    expect(result.cart!.total).toBe(0);
  });

  it('should detect abandoned session correctly', () => {
    const session = { id: 'session_3', status: 'ABANDONED', cart: { items: [] } };

    const result = mapper.map(session);

    expect(result.cart!.isAbandoned).toBe(true);
  });

  it('should use cart.total if already provided', () => {
    const session = {
      id: 'session_4',
      cart: { items: [{ price: 50, quantity: 2 }], total: 999 },
    };

    const result = mapper.map(session);

    expect(result.cart!.total).toBe(999);
  });
});

// ─────────────────────────────────────────────────────────────
// CartSyncService — instantiated directly with mocked renderer
// ─────────────────────────────────────────────────────────────
describe('CartSyncService', () => {
  let cartSync: CartSyncService;
  const mockRenderer = {
    render: jest.fn().mockResolvedValue({ id: 'runtime_1', status: 'RENDERED' }),
  };

  beforeAll(() => {
    cartSync = new CartSyncService(new CartContextMapper(), mockRenderer);
  });

  it('should still render when session has no cart items', async () => {
    const result = await cartSync.sync({}, { tenantId: 't1', userId: 'u1' } as any);
    expect(result).toBeDefined();
  });

  it('should call renderer and return runtime when cart has items', async () => {
    const session = {
      id: 'session_1',
      cart: { items: [{ id: 'p1', price: 100, quantity: 1 }] },
    };

    const result = await cartSync.sync(session, { tenantId: 't1', userId: 'u1' } as any);

    expect(mockRenderer.render).toHaveBeenCalled();
    expect(result).toBeDefined();
  });
});
