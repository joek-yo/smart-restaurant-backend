// FILE: src/modules/protection/infrastructure/queues/dead-letter.queue.ts

import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

/**
 * DeadLetterQueue
 * ---------------------------------------------------------
 * Final failure sink for unrecoverable workflow jobs.
 *
 * Responsibilities:
 * - capture permanently failed jobs
 * - store failure context for debugging & audits
 * - prevent infinite retry loops
 * - enable post-mortem analysis and manual intervention
 *
 * IMPORTANT:
 * Anything entering this queue is considered "non-recoverable"
 * by automated systems.
 */

export interface DeadLetterJob<T = any> {
  type: 'workflow' | 'payment' | 'checkout' | 'session' | 'conversation';

  payload: T;

  error: {
    message: string;
    stack?: string;
    code?: string;
  };

  workflowId?: string;

  tenantId: string;

  userId: string;

  metadata?: Record<string, any>;
}

@Injectable()
export class DeadLetterQueue {
  constructor(
    @InjectQueue('dead-letter-queue')
    private readonly queue: Queue,
  ) {}

  // ==================================================
  // 📥 SEND TO DEAD LETTER QUEUE
  // ==================================================

  async add(job: DeadLetterJob): Promise<void> {
    await this.queue.add('dead-letter', job, {
      priority: 1, // highest priority for inspection
      removeOnComplete: false,
      removeOnFail: false,
    });
  }

  // ==================================================
  // 📊 GET FAILURE STATS
  // ==================================================

  async getStats() {
    const [waiting, active, completed, failed] = await Promise.all([
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
  // 🔍 FETCH RECENT FAILURES
  // ==================================================

  async getRecentFailures(limit: number = 50) {
    const jobs = await this.queue.getJobs(['waiting', 'failed'], 0, limit - 1);

    return jobs.map((job) => ({
      id: job.id,
      data: job.data,
      timestamp: job.timestamp,
    }));
  }

  // ==================================================
  // 🧹 CLEAN QUEUE
  // ==================================================

  async clean(): Promise<void> {
    await this.queue.clean(0, 'completed');
    await this.queue.clean(0, 'failed');
  }
}