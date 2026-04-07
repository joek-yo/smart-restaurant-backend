// 📁 src/domains/sessions/tests/services/session-manager.service.spec.ts

import { SessionManagerService } from '../../../services/session-manager.service';
import { InMemorySessionRepository } from '../../../repositories/session.repository';
import { SessionEntity } from '../../../entities/session.entity';
import { CartItemEntity } from '../../../entities/cart-item.entity';
import { SessionState } from '../../../value-objects/session-state.vo';

describe('SessionManagerService', () => {
  let service: SessionManagerService;
  let sessionRepo: InMemorySessionRepository;

  beforeEach(() => {
    sessionRepo = new InMemorySessionRepository();
    service = new SessionManagerService(sessionRepo);
  });

  it('should create a new session', async () => {
    const session = await service.createSession('user1');
    expect(session.userId).toBe('user1');
    expect(session.state.value).toBe(SessionState.START);
  });

  it('should add an item to session', async () => {
    const session = await service.createSession('user2');
    const item = new CartItemEntity({ productId: 'prod1', name: 'Item 1', quantity: 2, price: 10, sessionId: session.id! });
    await service.addItem(session.userId, item);

    const updated = await sessionRepo.findById(session.id!);
    expect(updated?.items.length).toBe(1);
    expect(updated?.items[0].productId).toBe('prod1');
  });

  it('should checkout a session', async () => {
    const session = await service.createSession('user3');
    const item = new CartItemEntity({ productId: 'prod2', name: 'Item 2', quantity: 1, price: 20, sessionId: session.id! });
    await service.addItem(session.userId, item);

    await service.checkout(session.userId);
    const updated = await sessionRepo.findById(session.id!);
    expect(updated?.state.value).toBe(SessionState.CHECKOUT);
  });
});