// FILE: src/modules/follow-up-engine/application/strategies/sms-follow-up.strategy.ts

import { Injectable, Logger } from '@nestjs/common';

import { FollowUpJobEntity } from '../../domain/entities/follow-up-job.entity';
import { FollowUpLoggerService } from '../../infrastructure/observability/follow-up-logger.service';
import { FollowUpMetricsService } from '../../infrastructure/observability/follow-up-metrics.service';

/**
 * SMS FOLLOW-UP STRATEGY (FUTURE CHANNEL)
 * -----------------------------------------------------
 * Lightweight fallback delivery channel.
 *
 * Use cases:
 * - WhatsApp unavailable
 * - fallback for critical reminders
 * - region-based SMS delivery
 *
 * IMPORTANT:
 * Must behave EXACTLY like WhatsApp strategy:
 * same contract, same observability pattern.
 */

export interface SmsSenderPort {
  sendSms(input: {
    tenantId: string;
    userId: string;
    phone?: string;
    message: string;
    metadata?: Record<string, any>;
  }): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }>;
}

@Injectable()
export class SmsFollowUpStrategy {
  private readonly logger = new Logger(SmsFollowUpStrategy.name);

  constructor(
    private readonly sender: SmsSenderPort,
    private readonly loggerService: FollowUpLoggerService,
    private readonly metrics: FollowUpMetricsService,
  ) {}

  /**
   * MAIN ENTRY POINT
   */
  async execute(job: FollowUpJobEntity): Promise<void> {
    const start = Date.now();

    this.loggerService.log('SMS_FOLLOWUP_START', {
      jobId: job.id,
      userId: job.userId,
      type: job.type,
    });

    try {
      // ==================================================
      // 1. BUILD MESSAGE (reuse WhatsApp-safe format)
      // ==================================================
      const message = this.buildMessage(job);

      // ==================================================
      // 2. SEND SMS
      // ==================================================
      const result = await this.sender.sendSms({
        tenantId: job.tenantId,
        userId: job.userId,
        phone: job.payload?.phone,
        message,
        metadata: {
          followUpType: job.type,
          trigger: job.trigger,
          jobId: job.id,
        },
      });

      // ==================================================
      // 3. VALIDATE RESULT
      // ==================================================
      if (!result.success) {
        throw new Error(result.error || 'SMS send failed');
      }

      // ==================================================
      // 4. METRICS SUCCESS
      // ==================================================
      await this.metrics.incrementDelivered(job.type);

      this.loggerService.log('SMS_FOLLOWUP_SUCCESS', {
        jobId: job.id,
        messageId: result.messageId,
        durationMs: Date.now() - start,
      });
    } catch (error) {
      // ==================================================
      // FAILURE PATH
      // ==================================================
      await this.metrics.incrementFailed(job.type);

      this.loggerService.log('SMS_FOLLOWUP_FAILED', {
        jobId: job.id,
        error: error instanceof Error ? error.message : 'unknown',
      });

      this.logger.error(
        `[SMS_STRATEGY] failed job=${job.id}`,
        error as any,
      );

      throw error; // allow worker retry system to handle backoff
    }
  }

  // ==================================================
  // MESSAGE BUILDER (SMS-OPTIMIZED)
  // ==================================================
  private buildMessage(job: FollowUpJobEntity): string {
    const payload = job.payload || {};

    switch (job.type) {
      case 'ABANDONED_CART':
        return `You left items in your cart. Complete here: ${payload.checkoutLink || ''}`;

      case 'PAYMENT_RETRY':
        return `Payment failed. Retry here: ${payload.retryLink || ''}`;

      case 'CHECKOUT_RESUME':
        return `Resume checkout: ${payload.checkoutLink || ''}`;

      case 'ORDER_REMINDER':
        return `Order update: ${payload.trackingLink || ''}`;

      case 'REACTIVATION':
        return `We miss you. Come back: ${payload.ctaLink || ''}`;

      default:
        return `You have an update waiting for you.`;
    }
  }
}