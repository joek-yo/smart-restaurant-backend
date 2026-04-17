// 📁 src/domains/sessions/queues/retry-queue.ts

import { Injectable, Logger } from '@nestjs/common';
import { SessionRepository } from '../repositories/session.repository';
import { SessionEntity } from '../entities/session.entity';

@Injectable()
export class RetryQueue {
  private readonly logger = new Logger(RetryQueue.name);

  constructor(
    private readonly sessionRepo: SessionRepository,
  ) {}

  async processRetry(sessionId?: string): Promise<void> {
    if (sessionId) {
      const session = await this.sessionRepo.findById(sessionId);
      if (session) {
        await this.retrySession(session);
      }
      return;
    }

    const sessions = await this.sessionRepo.findByStatus('FAILED');

    for (const session of sessions) {
      await this.retrySession(session);
    }
  }

  private async retrySession(session: SessionEntity) {
    this.logger.log(`Retrying session ${session.id}`);

    try {
      // ONLY session retry logic here
      // (no notification logic at all anymore)

      session.markRetry(); // if exists in your domain
      await this.sessionRepo.update(session.id, session);

    } catch (error: any) {
      this.logger.error(
        `Failed to retry session ${session.id}: ${error.message}`,
      );
    }
  }
}