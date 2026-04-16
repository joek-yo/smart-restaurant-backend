// 📁 src/domains/sessions/tests/handlers/quantity-updated.handler.spec.ts

import { QuantityUpdatedHandler } from '../../../handlers/quantity-updated.handler';
import { InMemorySessionRepository } from '../../../repositories/session.repository';
import { SessionEntity } from '../../../entities/session.entity';
import { CartItemEntity } from '../../../entities/cart-item.entity';
import { QuantityUpdatedEvent } from '../../../events/quantity-updated.event';

describe('QuantityUpdatedHandler', () => {
  let handler: QuantityUpdatedHandler;
  let sessionRepo: InMemorySessionRepository;

  beforeEach(() => {
    sessionRepo = new InMemorySessionRepository();
    handler = new QuantityUpdatedHandler(sessionRepo);
  });

  it('should update the quantity of a cart item', async () => {
    const session = new SessionEntity({ userId: 'user1' });
    session.addItem(new CartItemEntity({ productId: 'p1', name: 'Pizza', quantity: 2, price: 10 }));
    await sessionRepo.create(session);

    const event = new QuantityUpdatedEvent({
      userId: 'user1',
      productId: 'p1',
      quantity: 5,
    });

    await handler.handle(event);

    const updated = await sessionRepo.findActiveByUser('user1');
    expect(updated?.items[0].quantity).toBe(5);
  });
});