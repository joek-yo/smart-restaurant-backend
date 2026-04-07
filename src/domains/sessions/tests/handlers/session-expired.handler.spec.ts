// 📁 src/domains/sessions/tests/handlers/session-expired.handler.spec.ts

import { SessionExpiredHandler } from '../../../handlers/session-expired.handler';
import { InMemorySessionRepository } from '../../../repositories/session.repository';
import { SessionEntity } from '../../../entities/session.entity';
import { SessionExpiredEvent } from '../../../events/session-expired.event';
import { SessionState } from '../../../value-objects/session-state.vo';

describe('SessionExpiredHandler', () => {
  let handler: SessionExpiredHandler;
  let sessionRepo: InMemorySessionRepository;

  beforeEach(() => {
    sessionRepo = new InMemorySessionRepository();
    handler = new SessionExpiredHandler(sessionRepo);
  });

  it('should mark session as EXPIRED', async () => {
    const session = new SessionEntity({ userId: 'user1' });
    await sessionRepo.create(session);

    const event = new SessionExpiredEvent({ userId: 'user1' });
    await handler.handle(event);

    const updated = await sessionRepo.findById(session.id!);
    expect(updated?.state.value).toBe(SessionState.EXPIRED);
  });
});