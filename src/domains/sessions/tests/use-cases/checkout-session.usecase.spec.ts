// src/domains/sessions/tests/use-cases/checkout.use-case.usecase.spec.ts

import { CheckoutSessionUseCase } from '../../../use-cases/checkout.use-case.usecase';
import { InMemorySessionRepository } from '../../../repositories/session.repository';
import { SessionEntity } from '../../../entities/session.entity';
import { CartItemEntity } from '../../../entities/cart-item.entity';

describe('CheckoutSessionUseCase', () => {
  let sessionRepo: InMemorySessionRepository;
  let checkoutUseCase: CheckoutSessionUseCase;

  beforeEach(() => {
    sessionRepo = new InMemorySessionRepository();
    checkoutUseCase = new CheckoutSessionUseCase(sessionRepo);
  });

  it('should successfully checkout a session with items', async () => {
    const item = new CartItemEntity({ productId: 'p1', name: 'Pizza', quantity: 2, price: 10 });
    const session = new SessionEntity({ userId: 'user1', items: [item] });
    await sessionRepo.create(session);

    const checkedOutSession = await checkoutUseCase.execute({ userId: 'user1' });

    expect(checkedOutSession.state.value).toBe('CHECKOUT');
  });

  it('should throw an error if cart is empty', async () => {
    const session = new SessionEntity({ userId: 'user2', items: [] });
    await sessionRepo.create(session);

    await expect(checkoutUseCase.execute({ userId: 'user2' })).rejects.toThrow('Cart is empty');
  });

  it('should throw if session does not exist', async () => {
    await expect(checkoutUseCase.execute({ userId: 'missing' })).rejects.toThrow('Session not found');
  });
});