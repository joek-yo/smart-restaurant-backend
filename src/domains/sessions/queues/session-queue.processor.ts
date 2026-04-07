// 📁 src/domains/sessions/queues/session-queue.processor.

import { Injectable, Logger } from '@nestjs/common';
import { OnQueueActive, Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { SessionRepository } from '../repositories/session.repository';
import { CartItemRepository } from '../repositories/cart-item.repository';
import { SessionEntity } from '../entities/session.entity';
import { SessionState } from '../value-objects/session-state.vo';
import { AbandonedCartQueue } from './abandoned-cart-queue';

@Injectable()
@Processor('session-queue')
export class SessionQueueProcessor {
  private readonly logger = new Logger(SessionQueueProcessor.name);

  constructor(
    private readonly sessionRepo: SessionRepository,
    private readonly cartRepo: CartItemRepository,
    private readonly abandonedCartQueue: AbandonedCartQueue,
  ) {}

  @Process('check-expired')
  async handleExpiredSessions(job: Job<{ sessionId: string }>) {
    const { sessionId } = job.data;

    const session: SessionEntity | null = await this.sessionRepo.findById(sessionId);
    if (!session) return;

    // Skip if already expired
    if (session.state.value === SessionState.EXPIRED) return;

    const now = new Date();
    if (session.expiresAt && session.expiresAt <= now) {
      session.expire();
      await this.sessionRepo.update(session.id!, session);

      this.logger.log(`Session ${session.id} expired.`);

      // Trigger abandoned cart queue
      await this.abandonedCartQueue.addAbandonedCart(session);
    }
  }
}