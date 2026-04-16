// 📁 src/domains/sessions/handlers/session-expired.handler.ts

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SessionExpiredEvent } from '../events/session-expired.event';
import { SessionRepository } from '../repositories/session.repository';
import { SessionCacheRepository } from '../repositories/session-cache.repository';
import { AbandonedCartQueue } from '../queues/abandoned-cart-queue';

@Injectable()
export class SessionExpiredHandler {
  private readonly logger = new Logger(SessionExpiredHandler.name);

  constructor(
    private readonly sessionRepo: SessionRepository,
    private readonly cacheRepo: SessionCacheRepository,
    private readonly abandonedCartQueue: AbandonedCartQueue,
  ) {}

  @OnEvent('session.expired', { async: true })
  async handle(event: SessionExpiredEvent) {
    try {
      // 1️⃣ Fetch session
      const session = await this.sessionRepo.findById(event.sessionId);
      if (!session) {
        this.logger.warn(`Session ${event.sessionId} not found`);
        return;
      }

      // 2️⃣ Mark session as EXPIRED
      session.status = 'EXPIRED';
      session.touch();
      await this.sessionRepo.update(session.id!, session);

      // 3️⃣ Evict session cache
      await this.cacheRepo.delete(event.userId);

      // 4️⃣ Trigger abandoned cart workflow (async queue)
      await this.abandonedCartQueue.add({
        sessionId: event.sessionId,
        userId: event.userId,
      });

      this.logger.log(`SessionExpired handled for session ${event.sessionId}`);
    } catch (err) {
      this.logger.error(
        `Error handling SessionExpiredEvent for session ${event.sessionId}`,
        err as any,
      );
      throw err;
    }
  }
}