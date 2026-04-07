// src/domains/sessions/tests/use-cases/restore-session.usecase.spec.ts

import { RestoreSessionUseCase } from '../../../use-cases/restore-session.usecase';
import { InMemorySessionRepository } from '../../../repositories/session.repository';
import { SessionEntity } from '../../../entities/session.entity';
import { CartItemEntity } from '../../../entities/cart-item.entity';

describe('RestoreSessionUseCase', () => {
  let sessionRepo: InMemorySessionRepository;
  let restoreUseCase: RestoreSessionUseCase;

  beforeEach(() => {
    sessionRepo = new InMemorySessionRepository();
    restoreUseCase = new RestoreSessionUseCase(sessionRepo);
  });

  it('should restore an existing session', async () => {
    const item = new CartItemEntity({ productId: 'p1', name: 'Pizza', quantity: 2, price: 10 });
    const session = new SessionEntity({ userId: 'user1', items: [item] });
    await sessionRepo.create(session);

    const restored = await restoreUseCase.execute({ userId: 'user1' });

    expect(restored).toBeDefined();
    expect(restored.items).toHaveLength(1);
    expect(restored.items[0].name).toBe('Pizza');
  });

  it('should throw if session does not exist', async () => {
    await expect(restoreUseCase.execute({ userId: 'user2' })).rejects.toThrow('Session not found');
  });
});