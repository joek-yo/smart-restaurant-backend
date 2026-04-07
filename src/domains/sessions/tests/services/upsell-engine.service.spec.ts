// 📁 src/domains/sessions/tests/services/upsell-engine.service.spec.ts

import { UpsellEngineService } from '../../../services/upsell-engine.service';
import { SessionEntity } from '../../../entities/session.entity';
import { CartItemEntity } from '../../../entities/cart-item.entity';

describe('UpsellEngineService', () => {
  let service: UpsellEngineService;

  beforeEach(() => {
    service = new UpsellEngineService();
  });

  it('should suggest upsell items based on current cart', async () => {
    const session = new SessionEntity({ userId: 'user1' });
    session.addItem(new CartItemEntity({ productId: 'p1', name: 'Burger', quantity: 1, price: 5 }));

    const suggestions = await service.suggest(session);
    expect(Array.isArray(suggestions)).toBe(true);
    suggestions.forEach(s => {
      expect(s.productId).toBeDefined();
      expect(s.name).toBeDefined();
    });
  });

  it('should return empty array if cart is empty', async () => {
    const session = new SessionEntity({ userId: 'user2' });
    const suggestions = await service.suggest(session);
    expect(suggestions).toEqual([]);
  });
});