// src/domains/sessions/tests/use-cases/reset-session.usecase.spec.ts

import { ResetSessionUseCase } from '../../../use-cases/reset-session.usecase';
import { InMemorySessionRepository } from '../../../repositories/session.repository';
import { SessionEntity } from '../../../entities/session.entity';
import { CartItemEntity } from '../../../entities/cart-item.entity';

describe('ResetSessionUseCase', () => {
  let sessionRepo: InMemorySessionRepository;
  let resetUseCase: ResetSessionUseCase;

  beforeEach(() => {
    sessionRepo = new InMemorySessionRepository();
    resetUseCase = new ResetSessionUseCase(sessionRepo);
  });

  it('should clear all items and reset state', async () => {
    const item = new CartItemEntity({ productId: 'p1', name: 'Burger', quantity: 3, price: 5 });
    const session = new SessionEntity({ userId: 'user1', items: [item] });
    await sessionRepo.create(session);

    const resetSession = await resetUseCase.execute({ userId: 'user1' });

    expect(resetSession.items).toHaveLength(0);
    expect(resetSession.state.value).toBe('START');
  });

  it('should throw if session does not exist', async () => {
    await expect(resetUseCase.execute({ userId: 'missing' })).rejects.toThrow('Session not found');
  });
});