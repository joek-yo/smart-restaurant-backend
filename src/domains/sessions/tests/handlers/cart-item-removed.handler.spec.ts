// 📁 src/domains/sessions/tests/handlers/cart-item-removed.handler.spec.ts

import { CartItemRemovedHandler } from '../../../handlers/cart-item-removed.handler';
import { InMemorySessionRepository } from '../../../repositories/session.repository';
import { SessionEntity } from '../../../entities/session.entity';
import { CartItemEntity } from '../../../entities/cart-item.entity';
import { CartItemRemovedEvent } from '../../../events/cart-item-removed.event';

describe('CartItemRemovedHandler', () => {
  let handler: CartItemRemovedHandler;
  let sessionRepo: InMemorySessionRepository;

  beforeEach(() => {
    sessionRepo = new InMemorySessionRepository();
    handler = new CartItemRemovedHandler(sessionRepo);
  });

  it('should remove a cart item from session', async () => {
    const session = new SessionEntity({ userId: 'user1' });
    session.addItem(new CartItemEntity({ productId: 'p1', name: 'Burger', quantity: 2, price: 5 }));
    await sessionRepo.create(session);

    const event = new CartItemRemovedEvent({
      userId: 'user1',
      productId: 'p1',
    });

    await handler.handle(event);

    const updated = await sessionRepo.findActiveByUser('user1');
    expect(updated?.items).toHaveLength(0);
  });
});