// 📁 src/domains/sessions/tests/handlers/session-checked-out.handler.spec.ts

import { SessionCheckedOutHandler } from '../../../handlers/session-checked-out.handler';
import { InMemorySessionRepository } from '../../../repositories/session.repository';
import { SessionEntity } from '../../../entities/session.entity';
import { CartItemEntity } from '../../../entities/cart-item.entity';
import { SessionCheckedOutEvent } from '../../../events/session-checked-out.event';
import { SessionState } from '../../../value-objects/session-state.vo';

describe('SessionCheckedOutHandler', () => {
  let handler: SessionCheckedOutHandler;
  let sessionRepo: InMemorySessionRepository;

  beforeEach(() => {
    sessionRepo = new InMemorySessionRepository();
    handler = new SessionCheckedOutHandler(sessionRepo);
  });

  it('should mark session as CHECKOUT', async () => {
    const session = new SessionEntity({ userId: 'user1' });
    session.addItem(new CartItemEntity({ productId: 'p1', name: 'Burger', quantity: 2, price: 5 }));
    await sessionRepo.create(session);

    const event = new SessionCheckedOutEvent({ userId: 'user1' });
    await handler.handle(event);

    const updated = await sessionRepo.findActiveByUser('user1');
    expect(updated?.state.value).toBe(SessionState.CHECKOUT);
  });
});