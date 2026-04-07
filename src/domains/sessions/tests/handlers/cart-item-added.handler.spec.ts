// 📁 src/domains/sessions/tests/handlers/cart-item-added.handler.spec.ts

import { CartItemAddedHandler } from '../../../handlers/cart-item-added.handler';
import { InMemorySessionRepository } from '../../../repositories/session.repository';
import { SessionEntity } from '../../../entities/session.entity';
import { CartItemEntity } from '../../../entities/cart-item.entity';
import { CartItemAddedEvent } from '../../../events/cart-item-added.event';

describe('CartItemAddedHandler', () => {
  let handler: CartItemAddedHandler;
  let sessionRepo: InMemorySessionRepository;

  beforeEach(() => {
    sessionRepo = new InMemorySessionRepository();
    handler = new CartItemAddedHandler(sessionRepo);
  });

  it('should add a cart item to session', async () => {
    const session = new SessionEntity({ userId: 'user1' });
    await sessionRepo.create(session);

    const event = new CartItemAddedEvent({
      userId: 'user1',
      productId: 'p1',
      name: 'Burger',
      quantity: 2,
      price: 5,
    });

    await handler.handle(event);

    const updated = await sessionRepo.findActiveByUser('user1');
    expect(updated?.items).toHaveLength(1);
    expect(updated?.items[0].name).toBe('Burger');
    expect(updated?.items[0].quantity).toBe(2);
  });
});