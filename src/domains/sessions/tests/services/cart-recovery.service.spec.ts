// 📁 src/domains/sessions/tests/services/cart-recovery.service.spec.ts

import { CartRecoveryService } from '../../../services/cart-recovery.service';
import { InMemorySessionRepository } from '../../../repositories/session.repository';
import { InMemoryCartItemRepository } from '../../../repositories/cart-item.repository';
import { SessionEntity } from '../../../entities/session.entity';
import { CartItemEntity } from '../../../entities/cart-item.entity';
import { SessionState } from '../../../value-objects/session-state.vo';

describe('CartRecoveryService', () => {
  let service: CartRecoveryService;
  let sessionRepo: InMemorySessionRepository;
  let cartRepo: InMemoryCartItemRepository;

  beforeEach(() => {
    sessionRepo = new InMemorySessionRepository();
    cartRepo = new InMemoryCartItemRepository();
    service = new CartRecoveryService(sessionRepo, cartRepo);
  });

  it('should restore abandoned session with items', async () => {
    const session = new SessionEntity({ userId: 'user1', state: new SessionState(SessionState.ABANDONED) });
    await sessionRepo.create(session);

    const item = new CartItemEntity({ sessionId: session.id!, productId: 'p1', name: 'Item 1', quantity: 1, price: 10 });
    await cartRepo.create(item);

    const restored = await service.restoreSession('user1');
    expect(restored?.state.value).toBe(SessionState.START);
    expect(restored?.items.length).toBe(1);
    expect(restored?.items[0].productId).toBe('p1');
  });

  it('should return null if no abandoned session exists', async () => {
    const result = await service.restoreSession('user2');
    expect(result).toBeNull();
  });
});