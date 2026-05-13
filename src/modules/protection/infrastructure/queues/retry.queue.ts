// FILE: src/modules/protection/infrastructure/queues/retry.queue.ts

import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

import { OptOutProtectionService } from '../../application/services/opt-out-protection.service';

/**
 * RetryQueue
 * ---------------------------------------------------------
 * Central retry queue for transient workflow failures.
 *
 * Responsibilities:
 * - retry temporary failures safely
 * - apply exponential backoff
 * - isolate retry execution from request lifecycle
 * - prevent retry storms
 *
 * OPT-OUT ENFORCEMENT:
 * - opted-out users MUST NEVER receive retry executions
 */

export interface RetryJob {
  tenantId: string;

  userId: string;

  type:
    | 'message-delivery'
    | 'workflow-recovery'
    | 'payment-retry'
    | 'checkout-retry'
    | 'conversation-retry'
    | 'generic';

  payload: Record<string, any>;

  priority?: number;

  delay?: number;

  attempts?: number;
}

@Injectable()
export class RetryQueue {
  private readonly logger = new Logger(RetryQueue.name);

  constructor(
    @InjectQueue('retry-queue')
    private readonly queue: Queue,

    private readonly optOutProtection: OptOutProtectionService,
  ) {}

  // ==================================================
  // 📥 ENQUEUE RETRY JOB
  // ==================================================

  async addJob(job: RetryJob): Promise<void> {
    // ==================================================
    // 🚫 GLOBAL OPT-OUT ENFORCEMENT
    // ==================================================

    const suppression =
      await this.optOutProtection.isOptedOut({
        tenantId: job.tenantId,
        userId: job.userId,
      });

    if (suppression.isOptedOut) {
      this.logger.warn(
        `[RetryQueue] BLOCKED retry job for opted-out user=${job.userId}`,
      );

      return;
    }

    // ==================================================
    // 🚀 ENQUEUE RETRY JOB
    // ==================================================

    await this.queue.add(job.type, job.payload, {
      priority: job.priority ?? 5,

      delay: job.delay ?? 0,

      attempts: job.attempts ?? 5,

      backoff: {
        type: 'exponential',
        delay: 3000,
      },

      removeOnComplete: true,

      removeOnFail: false,
    });

    this.logger.log(
      `[RetryQueue] queued type=${job.type} user=${job.userId}`,
    );
  }

  // ==================================================
  // 📊 QUEUE STATS
  // ==================================================

  async getStats() {
    const [waiting, active, completed, failed] =
      await Promise.all([
        this.queue.getWaitingCount(),
        this.queue.getActiveCount(),
        this.queue.getCompletedCount(),
        this.queue.getFailedCount(),
      ]);

    return {
      waiting,
      active,
      completed,
      failed,
    };
  }

  // ==================================================
  // 🧹 CLEAN QUEUE
  // ==================================================

  async clean(): Promise<void> {
    await this.queue.clean(0, 'completed');
    await this.queue.clean(0, 'failed');
  }
}