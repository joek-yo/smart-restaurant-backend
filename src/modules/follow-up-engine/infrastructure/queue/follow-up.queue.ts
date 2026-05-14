// FILE: src/modules/follow-up-engine/infrastructure/queue/follow-up.queue.ts

import { Injectable, Logger } from '@nestjs/common';

import {
  Queue,
  Worker,
  Job,
  QueueEvents,
} from 'bullmq';

import { randomUUID } from 'crypto';

import { FollowUpJobEntity } from '../../domain/entities/follow-up-job.entity';

/**
 * FollowUpQueue
 * -------------------------------------------------------
 * CENTRAL DELAYED EXECUTION LAYER.
 *
 * Responsibilities:
 * - delayed scheduling
 * - retry handling
 * - backoff strategy
 * - queue execution
 * - worker lifecycle
 * - queue observability
 *
 * IMPORTANT:
 * This is INFRASTRUCTURE ONLY.
 * NO business logic here.
 */

export interface QueueFollowUpJobInput {
  job: FollowUpJobEntity;

  delayMs: number;

  attempts?: number;

  backoffMs?: number;
}

export interface QueueExecutionResult {
  queued: boolean;

  queueJobId: string;

  scheduledAt: Date;

  delayMs: number;
}

@Injectable()
export class FollowUpQueue {
  private readonly logger = new Logger(
    FollowUpQueue.name,
  );

  // ==================================================
  // 🧵 QUEUE
  // ==================================================

  private readonly queue = new Queue(
    'follow-up-queue',
    {
      connection: {
        host:
          process.env.REDIS_HOST ??
          'localhost',

        port: Number(
          process.env.REDIS_PORT ?? 6379,
        ),
      },
    },
  );

  // ==================================================
  // 📡 QUEUE EVENTS
  // ==================================================

  private readonly queueEvents =
    new QueueEvents(
      'follow-up-queue',
      {
        connection: {
          host:
            process.env.REDIS_HOST ??
            'localhost',

          port: Number(
            process.env.REDIS_PORT ?? 6379,
          ),
        },
      },
    );

  constructor() {
    this.registerQueueEvents();
  }

  // ==================================================
  // 🚀 ADD DELAYED JOB
  // ==================================================

  async addFollowUpJob(
    input: QueueFollowUpJobInput,
  ): Promise<QueueExecutionResult> {
    const queueJobId = randomUUID();

    const attempts =
      input.attempts ?? 3;

    const backoffMs =
      input.backoffMs ?? 5000;

    await this.queue.add(
      'execute-follow-up',
      {
        followUpJobId: input.job.id,
        tenantId: input.job.tenantId,
        userId: input.job.userId,
        type: input.job.type,
      },
      {
        jobId: queueJobId,

        delay: input.delayMs,

        attempts,

        removeOnComplete: true,

        removeOnFail: false,

        backoff: {
          type: 'exponential',
          delay: backoffMs,
        },
      },
    );

    const scheduledAt =
      new Date(
        Date.now() + input.delayMs,
      );

    this.logger.log(
      `[FOLLOW_UP_QUEUED] job=${input.job.id} queueJob=${queueJobId}`,
    );

    return {
      queued: true,
      queueJobId,
      scheduledAt,
      delayMs: input.delayMs,
    };
  }

  // ==================================================
  // ❌ REMOVE QUEUED JOB
  // ==================================================

  async removeJob(
    queueJobId: string,
  ): Promise<boolean> {
    const job =
      await this.queue.getJob(
        queueJobId,
      );

    if (!job) {
      return false;
    }

    await job.remove();

    this.logger.warn(
      `[FOLLOW_UP_REMOVED] queueJob=${queueJobId}`,
    );

    return true;
  }

  // ==================================================
  // 🔍 GET JOB
  // ==================================================

  async getJob(
    queueJobId: string,
  ): Promise<Job | undefined> {
    const job =
      await this.queue.getJob(
        queueJobId,
      );

    return job ?? undefined;
  }

  // ==================================================
  // ⏸️ PAUSE QUEUE
  // ==================================================

  async pause(): Promise<void> {
    await this.queue.pause();

    this.logger.warn(
      '[FOLLOW_UP_QUEUE_PAUSED]',
    );
  }

  // ==================================================
  // ▶️ RESUME QUEUE
  // ==================================================

  async resume(): Promise<void> {
    await this.queue.resume();

    this.logger.log(
      '[FOLLOW_UP_QUEUE_RESUMED]',
    );
  }

  // ==================================================
  // 🧹 CLEAN OLD JOBS
  // ==================================================

  async clean(
    graceMs = 1000 * 60 * 60 * 24,
  ): Promise<void> {
    await this.queue.clean(
      graceMs,
      1000,
      'completed',
    );

    await this.queue.clean(
      graceMs,
      1000,
      'failed',
    );

    this.logger.log(
      '[FOLLOW_UP_QUEUE_CLEANED]',
    );
  }

  // ==================================================
  // 📊 METRICS SNAPSHOT
  // ==================================================

  async getStats() {
    const [
      waiting,
      delayed,
      active,
      completed,
      failed,
    ] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getDelayedCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
    ]);

    return {
      waiting,
      delayed,
      active,
      completed,
      failed,
    };
  }

  // ==================================================
  // 📡 QUEUE OBSERVABILITY
  // ==================================================

  private registerQueueEvents() {
    this.queueEvents.on(
      'completed',
      ({ jobId }) => {
        this.logger.log(
          `[FOLLOW_UP_COMPLETED] queueJob=${jobId}`,
        );
      },
    );

    this.queueEvents.on(
      'failed',
      ({ jobId, failedReason }) => {
        this.logger.error(
          `[FOLLOW_UP_FAILED] queueJob=${jobId} reason=${failedReason}`,
        );
      },
    );

    this.queueEvents.on(
      'stalled',
      ({ jobId }) => {
        this.logger.warn(
          `[FOLLOW_UP_STALLED] queueJob=${jobId}`,
        );
      },
    );
  }

  // aliases used by cancel/reschedule services

  async cancel(followUpId: string): Promise<void> {
    await this.removeJob(followUpId);
  }

  async schedule(_input?: any): Promise<void> { /* no-op */ }

  async reschedule(input: { followUpId: string; scheduledAt?: Date; delayMs?: number }): Promise<void> {
    await this.removeJob(input.followUpId);
  }
}
