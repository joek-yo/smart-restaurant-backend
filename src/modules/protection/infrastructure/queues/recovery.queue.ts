// FILE: src/modules/protection/infrastructure/queues/recovery.queue.ts

import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

import { RecoveryPipelineInput } from '../../application/pipelines/recovery.pipeline';

// ✅ ADD THIS
import { OptOutProtectionService } from '../../application/services/opt-out-protection.service';

/**
 * RecoveryQueue
 * ---------------------------------------------------------
 * Async queue layer for recovery execution jobs.
 *
 * Responsibilities:
 * - enqueue recovery pipeline jobs
 * - decouple recovery execution from request lifecycle
 * - support retry/backoff for failed recovery attempts
 * - enable horizontal scaling of recovery workers
 *
 * OPT-OUT ENFORCEMENT:
 * - opted-out users MUST NEVER enter recovery execution
 *
 * This is the RESILIENCE BUFFER between:
 * API → Recovery Pipeline → Workers
 */

export interface RecoveryJob {
  payload: RecoveryPipelineInput;

  priority?: number;

  delay?: number;

  attempts?: number;
}

@Injectable()
export class RecoveryQueue {
  private readonly logger = new Logger(RecoveryQueue.name);

  constructor(
    @InjectQueue('recovery-queue')
    private readonly queue: Queue,

    // ✅ ADD THIS
    private readonly optOutProtection: OptOutProtectionService,
  ) {}

  // ==================================================
  // 📥 ENQUEUE RECOVERY JOB
  // ==================================================

  async addJob(job: RecoveryJob): Promise<void> {
    // ==================================================
    // 🚫 GLOBAL OPT-OUT ENFORCEMENT
    // ==================================================

    const suppression =
      await this.optOutProtection.isOptedOut(job.payload.userId, job.payload.tenantId);

    if (suppression) {
      this.logger.warn(
        `[RecoveryQueue] BLOCKED opted-out recovery job user=${job.payload.userId}`,
      );

      return;
    }

    // ==================================================
    // 🚀 ENQUEUE RECOVERY JOB
    // ==================================================

    await this.queue.add('execute-recovery', job.payload, {
      priority: job.priority ?? 5,
      delay: job.delay ?? 0,
      attempts: job.attempts ?? 3,

      backoff: {
        type: 'exponential',
        delay: 2000,
      },

      removeOnComplete: true,
      removeOnFail: false,
    });
  }

  // ==================================================
  // 📊 GET QUEUE STATS
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