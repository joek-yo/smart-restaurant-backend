// src/domains/sessions/tests/use-cases/remove-from-cart.use-case.usecase.spec.ts

import { RemoveFromCartUseCase } from '../../../use-cases/remove-from-cart.use-case.usecase';
import { InMemorySessionRepository } from '../../../repositories/session.repository';
import { InMemoryCartItemRepository } from '../../../repositories/cart-item.repository';
import { CartItemEntity } from '../../../entities/cart-item.entity';
import { SessionEntity } from '../../../entities/session.entity';

describe('RemoveFromCartUseCase', () => {
  let sessionRepo: InMemorySessionRepository;
  let cartRepo: InMemoryCartItemRepository;
  let removeFromCart: RemoveFromCartUseCase;

  beforeEach(() => {
    sessionRepo = new InMemorySessionRepository();
    cartRepo = new InMemoryCartItemRepository();
    removeFromCart = new RemoveFromCartUseCase(sessionRepo, cartRepo);
  });

  it('should remove an item from the session', async () => {
    const session = new SessionEntity({ userId: 'user1' });
    const item = new CartItemEntity({ productId: 'p1', name: 'Pizza', quantity: 2, price: 10 });
    session.addItem(item);
    await sessionRepo.create(session);

    const updatedSession = await removeFromCart.execute({
      userId: 'user1',
      productId: 'p1',
    });

    expect(updatedSession.items.length).toBe(0);
  });

  it('should throw if the item does not exist', async () => {
    const session = new SessionEntity({ userId: 'user2' });
    await sessionRepo.create(session);

    await expect(
      removeFromCart.execute({ userId: 'user2', productId: 'unknown' })
    ).rejects.toThrow('Item not found in cart');
  });

  it('should throw if session does not exist', async () => {
    await expect(
      removeFromCart.execute({ userId: 'missing', productId: 'p1' })
    ).rejects.toThrow('Session not found');
  });
});