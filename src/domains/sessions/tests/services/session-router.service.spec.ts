// 📁 src/domains/sessions/tests/services/session-router.service.spec.ts

import { SessionRouterService } from '../../../services/session-router.service';
import { SessionEntity } from '../../../entities/session.entity';
import { SessionState } from '../../../value-objects/session-state.vo';

describe('SessionRouterService', () => {
  let service: SessionRouterService;

  beforeEach(() => {
    service = new SessionRouterService();
  });

  it('should send session updates to external channels', async () => {
    const session = new SessionEntity({ userId: 'user1', state: new SessionState(SessionState.CART_UPDATED) });

    const sendSpy = jest.spyOn(service, 'sendToChannels').mockImplementation(async () => true);

    const result = await service.pushUpdate(session);
    expect(sendSpy).toHaveBeenCalledWith(session);
    expect(result).toBe(true);

    sendSpy.mockRestore();
  });
});