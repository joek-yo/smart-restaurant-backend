// src/domains/sessions/tests/use-cases/add-to-cart.usecase.spec.ts

import { AddToCartUseCase } from '../../../use-cases/add-to-cart.usecase';
import { InMemorySessionRepository } from '../../../repositories/session.repository';
import { InMemoryCartItemRepository } from '../../../repositories/cart-item.repository';
import { CartItemEntity } from '../../../entities/cart-item.entity';
import { SessionEntity } from '../../../entities/session.entity';

describe('AddToCartUseCase', () => {
  let sessionRepo: InMemorySessionRepository;
  let cartRepo: InMemoryCartItemRepository;
  let addToCart: AddToCartUseCase;

  beforeEach(() => {
    sessionRepo = new InMemorySessionRepository();
    cartRepo = new InMemoryCartItemRepository();
    addToCart = new AddToCartUseCase(sessionRepo, cartRepo);
  });

  it('should add a new item to an empty session', async () => {
    const session = new SessionEntity({ userId: 'user1' });
    await sessionRepo.create(session);

    const result = await addToCart.execute({
      userId: 'user1',
      productId: 'p1',
      quantity: 2,
      options: { size: 'M' },
    });

    expect(result.items.length).toBe(1);
    expect(result.items[0].productId).toBe('p1');
    expect(result.items[0].quantity).toBe(2);
  });

  it('should increment quantity if item already exists', async () => {
    const session = new SessionEntity({ userId: 'user2' });
    const item = new CartItemEntity({ productId: 'p2', name: 'Burger', quantity: 1, price: 5 });
    session.addItem(item);
    await sessionRepo.create(session);

    const result = await addToCart.execute({
      userId: 'user2',
      productId: 'p2',
      quantity: 3,
    });

    expect(result.items.length).toBe(1);
    expect(result.items[0].quantity).toBe(4);
  });

  it('should throw if session does not exist', async () => {
    await expect(
      addToCart.execute({ userId: 'unknown', productId: 'p3', quantity: 1 })
    ).rejects.toThrow('Session not found');
  });
});