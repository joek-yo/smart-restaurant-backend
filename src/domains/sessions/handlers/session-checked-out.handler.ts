// 📁 src/domains/sessions/handlers/session-checked-out.handler.ts

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SessionCheckedOutEvent } from '../events/session-checked-out.event';
import { SessionRepository } from '../repositories/session.repository';
import { SessionCacheRepository } from '../repositories/session-cache.repository';
import { AnalyticsAdapter } from '../adapters/analytics.adapter';
import { PaymentSessionAdapter } from '../adapters/payment-session.adapter';

@Injectable()
export class SessionCheckedOutHandler {
  private readonly logger = new Logger(SessionCheckedOutHandler.name);

  constructor(
    private readonly sessionRepo: SessionRepository,
    private readonly cacheRepo: SessionCacheRepository,
    private readonly analytics: AnalyticsAdapter,
    private readonly paymentAdapter: PaymentSessionAdapter,
  ) {}

  @OnEvent('session.checked-out', { async: true })
  async handle(event: SessionCheckedOutEvent) {
    try {
      // 1️⃣ Mark session as CHECKED_OUT
      const session = await this.sessionRepo.findById(event.sessionId);
      if (!session) {
        this.logger.warn(`Session ${event.sessionId} not found`);
        return;
      }
      session.status = 'CHECKED_OUT';
      session.touch();
      await this.sessionRepo.update(session.id!, session);

      // 2️⃣ Remove session from cache
      await this.cacheRepo.delete(event.userId);

      // 3️⃣ Trigger payment processing
      await this.paymentAdapter.processPayment({
        sessionId: event.sessionId,
        userId: event.userId,
        amount: event.totalAmount,
        items: event.items,
      });

      // 4️⃣ Track analytics
      await this.analytics.trackSessionCheckedOut(event);

      this.logger.log(`SessionCheckedOut handled for session ${event.sessionId}`);
    } catch (err) {
      this.logger.error(
        `Error handling SessionCheckedOutEvent for session ${event.sessionId}`,
        err as any,
      );
      throw err;
    }
  }
}