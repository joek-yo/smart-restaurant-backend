// 📁 src/domains/sessions/tests/services/session-logger.service.spec.ts

import { SessionLoggerService } from '../../../services/session-logger.service';
import { InMemorySessionRepository } from '../../../repositories/session.repository';
import { SessionEntity } from '../../../entities/session.entity';

describe('SessionLoggerService', () => {
  let service: SessionLoggerService;
  let sessionRepo: InMemorySessionRepository;

  beforeEach(() => {
    sessionRepo = new InMemorySessionRepository();
    service = new SessionLoggerService(sessionRepo);
  });

  it('should log session creation', async () => {
    const session = new SessionEntity({ userId: 'user1' });
    await sessionRepo.create(session);

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await service.logCreation(session);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Session created:'));
    logSpy.mockRestore();
  });

  it('should log session updates', async () => {
    const session = new SessionEntity({ userId: 'user2' });
    await sessionRepo.create(session);

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await service.logUpdate(session);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Session updated:'));
    logSpy.mockRestore();
  });
});