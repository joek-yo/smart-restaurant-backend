// src/domains/sessions/tests/use-cases/update-quantity.use-case.usecase.spec.ts

import { UpdateQuantityUseCase } from '../../../use-cases/update-quantity.use-case.usecase';
import { InMemorySessionRepository } from '../../../repositories/session.repository';
import { CartItemEntity } from '../../../entities/cart-item.entity';
import { SessionEntity } from '../../../entities/session.entity';

describe('UpdateQuantityUseCase', () => {
  let sessionRepo: InMemorySessionRepository;
  let updateQuantityUseCase: UpdateQuantityUseCase;

  beforeEach(() => {
    sessionRepo = new InMemorySessionRepository();
    updateQuantityUseCase = new UpdateQuantityUseCase(sessionRepo);
  });

  it('should update quantity of an existing cart item', async () => {
    const item = new CartItemEntity({ productId: 'p1', name: 'Burger', quantity: 2, price: 5 });
    const session = new SessionEntity({ userId: 'user1', items: [item] });
    await sessionRepo.create(session);

    const updatedSession = await updateQuantityUseCase.execute({
      userId: 'user1',
      productId: 'p1',
      quantity: 5,
    });

    const updatedItem = updatedSession.items.find(i => i.productId === 'p1');
    expect(updatedItem?.quantity).toBe(5);
  });

  it('should throw if item does not exist', async () => {
    const session = new SessionEntity({ userId: 'user2' });
    await sessionRepo.create(session);

    await expect(
      updateQuantityUseCase.execute({ userId: 'user2', productId: 'p2', quantity: 3 })
    ).rejects.toThrow('Item not found');
  });

  it('should throw if session does not exist', async () => {
    await expect(
      updateQuantityUseCase.execute({ userId: 'missing', productId: 'p1', quantity: 1 })
    ).rejects.toThrow('Session not found');
  });
});