// 📁 src/domains/sessions/tests/handlers/abandoned-cart.handler.spec.ts

import { AbandonedCartHandler } from '../../../handlers/abandoned-cart.handler';
import { InMemorySessionRepository } from '../../../repositories/session.repository';
import { SessionEntity } from '../../../entities/session.entity';
import { AbandonedCartTriggeredEvent } from '../../../events/abandoned-cart-triggered.event';
import { SessionState } from '../../../value-objects/session-state.vo';

describe('AbandonedCartHandler', () => {
  let handler: AbandonedCartHandler;
  let sessionRepo: InMemorySessionRepository;

  beforeEach(() => {
    sessionRepo = new InMemorySessionRepository();
    handler = new AbandonedCartHandler(sessionRepo);
  });

  it('should mark session as ABANDONED', async () => {
    const session = new SessionEntity({ userId: 'user1' });
    await sessionRepo.create(session);

    const event = new AbandonedCartTriggeredEvent({ userId: 'user1' });
    await handler.handle(event);

    const updated = await sessionRepo.findById(session.id!);
    expect(updated?.state.value).toBe(SessionState.ABANDONED);
  });
});