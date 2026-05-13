// FILE: src/modules/protection/infrastructure/queues/timeout.queue.ts

import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

import { HandleTimeoutInput } from '../../application/use-cases/handle-timeout.use-case';

// ✅ ADD THIS
import { OptOutProtectionService } from '../../application/services/opt-out-protection.service';

/**
 * TimeoutQueue
 * ---------------------------------------------------------
 * Dedicated async queue for workflow timeout handling.
 *
 * Responsibilities:
 * - schedule timeout recovery jobs
 * - decouple timeout detection from execution
 * - ensure delayed handling of stalled workflows
 * - prevent blocking main execution threads
 *
 * OPT-OUT ENFORCEMENT:
 * - opted-out users MUST NEVER enter timeout execution
 *
 * This queue handles:
 * - conversation inactivity timeouts
 * - session expiry
 * - checkout/payment stalls
 * - long-running workflow freezes
 */

export interface TimeoutJob {
  payload: HandleTimeoutInput;

  delayMs?: number;

  priority?: number;

  attempts?: number;
}

@Injectable()
export class TimeoutQueue {
  private readonly logger = new Logger(TimeoutQueue.name);

  constructor(
    @InjectQueue('timeout-queue')
    private readonly queue: Queue,

    // ✅ ADD THIS
    private readonly optOutProtection: OptOutProtectionService,
  ) {}

  // ==================================================
  // 📥 SCHEDULE TIMEOUT JOB
  // ==================================================

  async schedule(job: TimeoutJob): Promise<void> {
    // ==================================================
    // 🚫 GLOBAL OPT-OUT ENFORCEMENT
    // ==================================================

    const suppression =
      await this.optOutProtection.isOptedOut({
        tenantId: job.payload.tenantId,
        userId: job.payload.userId,
      });

    if (suppression.isOptedOut) {
      this.logger.warn(
        `[TimeoutQueue] BLOCKED timeout job for opted-out user=${job.payload.userId}`,
      );

      return;
    }

    // ==================================================
    // ⏳ ENQUEUE TIMEOUT JOB
    // ==================================================

    await this.queue.add('handle-timeout', job.payload, {
      delay: job.delayMs ?? 30_000, // default 30s

      priority: job.priority ?? 5,

      attempts: job.attempts ?? 3,

      backoff: {
        type: 'exponential',
        delay: 5000,
      },

      removeOnComplete: true,

      removeOnFail: false,
    });

    this.logger.log(
      `[TimeoutQueue] scheduled timeout job user=${job.payload.userId}`,
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