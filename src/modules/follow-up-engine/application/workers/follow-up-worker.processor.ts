// FILE: src/modules/follow-up-engine/application/workers/follow-up-worker.processor.ts

import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

import { FollowUpRepository } from '../../domain/repositories/follow-up.repository';
import { FollowUpQueueRedis } from '../../infrastructure/redis/follow-up-queue.redis';

import { FollowUpLoggerService } from '../../infrastructure/observability/follow-up-logger.service';
import { FollowUpMetricsService } from '../../infrastructure/observability/follow-up-metrics.service';

import { FollowUpJobEntity } from '../../domain/entities/follow-up-job.entity';
import { FollowUpStatus } from '../../domain/enums/follow-up-status.enum';

/**
 * FOLLOW-UP WORKER PROCESSOR
 * -----------------------------------------------------
 * This is the FINAL execution layer.
 *
 * Responsibilities:
 * - dequeue scheduled jobs
 * - validate job still valid
 * - prevent duplicate execution
 * - execute delivery strategy (WhatsApp/SMS/etc)
 * - mark completed
 * - retry failures safely
 */

@Processor('follow-up-queue')
@Injectable()
export class FollowUpWorkerProcessor extends WorkerHost {
  private readonly logger = new Logger(FollowUpWorkerProcessor.name);

  constructor(
    private readonly repository: FollowUpRepository,
    private readonly queue: FollowUpQueueRedis,
    private readonly followUpLogger: FollowUpLoggerService,
    private readonly metrics: FollowUpMetricsService,
  ) {
    super();
  }

  /**
   * MAIN JOB EXECUTION ENTRY
   */
  async process(job: Job<FollowUpJobEntity>): Promise<any> {
    const data = job.data;

    this.followUpLogger.log('FOLLOW_UP_EXECUTION_START', {
      jobId: job.id,
      type: data.type,
      userId: data.userId,
      tenantId: data.tenantId,
    });

    try {
      // ==================================================
      // 1. LOAD FRESH STATE FROM DB (SOURCE OF TRUTH)
      // ==================================================
      const latestJob = await this.repository.findById(data.id);

      if (!latestJob) {
        this.logger.warn(`[FOLLOW_UP] job not found: ${data.id}`);
        return;
      }

      // ==================================================
      // 2. VALIDATION GATE (CRITICAL SAFETY CHECKS)
      // ==================================================

      if (latestJob.status === FollowUpStatus.CANCELLED) {
        this.logger.warn(`[FOLLOW_UP] cancelled job skipped: ${data.id}`);
        return;
      }

      if (latestJob.status === FollowUpStatus.COMPLETED) {
        this.logger.warn(`[FOLLOW_UP] already completed: ${data.id}`);
        return;
      }

      if (latestJob.scheduledAt > new Date()) {
        this.logger.warn(`[FOLLOW_UP] not due yet: ${data.id}`);
        return;
      }

      // ==================================================
      // 3. EXECUTE DELIVERY STRATEGY
      // ==================================================
      await this.executeStrategy(latestJob);

      // ==================================================
      // 4. MARK COMPLETED
      // ==================================================
      latestJob.status = FollowUpStatus.COMPLETED;
      latestJob.completedAt = new Date();

      await this.repository.update(latestJob.id, latestJob);

      // ==================================================
      // 5. METRICS
      // ==================================================
      await this.metrics.incrementSent(latestJob.type);

      this.followUpLogger.log('FOLLOW_UP_EXECUTION_SUCCESS', {
        jobId: latestJob.id,
        type: latestJob.type,
      });

      return { success: true };
    } catch (error) {
      // ==================================================
      // 6. FAILURE HANDLING + RETRY SAFETY
      // ==================================================

      this.logger.error(
        `[FOLLOW_UP] execution failed: ${data.id}`,
        error as any,
      );

      await this.metrics.incrementFailed(data.type);

      await this.followUpLogger.log('FOLLOW_UP_EXECUTION_FAILED', {
        jobId: data.id,
        error: error instanceof Error ? error.message : 'unknown',
      });

      throw error; // BullMQ will handle retry/backoff
    }
  }

  /**
   * DELIVERY STRATEGY ROUTER
   */
  private async executeStrategy(job: FollowUpJobEntity) {
    switch (job.channel) {
      case 'whatsapp':
        return this.sendWhatsApp(job);

      case 'sms':
        return this.sendSMS(job);

      case 'email':
        return this.sendEmail(job);

      default:
        throw new Error(`Unsupported channel: ${job.channel}`);
    }
  }

  /**
   * WHATSAPP DELIVERY
   */
  private async sendWhatsApp(job: FollowUpJobEntity) {
    // In real system: inject WhatsApp sender service
    this.logger.log(
      `[WHATSAPP] sending follow-up to user=${job.userId}`,
    );

    // Example payload usage:
    // job.payload.message
    // job.payload.template
  }

  /**
   * SMS DELIVERY (FUTURE)
   */
  private async sendSMS(job: FollowUpJobEntity) {
    this.logger.log(`[SMS] sending follow-up to user=${job.userId}`);
  }

  /**
   * EMAIL DELIVERY (FUTURE)
   */
  private async sendEmail(job: FollowUpJobEntity) {
    this.logger.log(`[EMAIL] sending follow-up to user=${job.userId}`);
  }
}