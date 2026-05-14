// FILE: src/modules/follow-up-engine/application/strategies/whatsapp-follow-up.strategy.ts

import { Injectable, Logger } from '@nestjs/common';

import { FollowUpJobEntity } from '../../domain/entities/follow-up-job.entity';
import { FollowUpLoggerService } from '../../infrastructure/observability/follow-up-logger.service';
import { FollowUpMetricsService } from '../../infrastructure/observability/follow-up-metrics.service';

/**
 * WHATSAPP FOLLOW-UP STRATEGY
 * -----------------------------------------------------
 * Responsible for actual message delivery via WhatsApp.
 *
 * Responsibilities:
 * - format message payload
 * - attach contextual data
 * - send message via WhatsApp provider
 * - handle delivery failures
 * - emit observability signals
 *
 * IMPORTANT:
 * This is ONLY a delivery adapter.
 * NO business logic here.
 */

export interface WhatsAppSenderPort {
  sendMessage(input: {
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
export class WhatsAppFollowUpStrategy {
  private readonly logger = new Logger(WhatsAppFollowUpStrategy.name);

  constructor(
    private readonly sender: WhatsAppSenderPort,
    private readonly loggerService: FollowUpLoggerService,
    private readonly metrics: FollowUpMetricsService,
  ) {}

  /**
   * MAIN ENTRY POINT
   */
  async execute(job: FollowUpJobEntity): Promise<void> {
    const start = Date.now();

    this.loggerService.info('WhatsappFollowUpStrategy', 'WHATSAPP_FOLLOWUP_START', {
      jobId: job.id,
      userId: job.userId,
      type: job.type,
    });

    try {
      // ==================================================
      // 1. BUILD MESSAGE
      // ==================================================
      const message = this.buildMessage(job);

      // ==================================================
      // 2. SEND MESSAGE
      // ==================================================
      const result = await this.sender.sendMessage({
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
      // 3. HANDLE FAILURE
      // ==================================================
      if (!result.success) {
        throw new Error(result.error || 'WhatsApp send failed');
      }

      // ==================================================
      // 4. METRICS SUCCESS
      // ==================================================
      await this.metrics.recordSent({ followUpType: job.type });

      this.loggerService.info('WhatsappFollowUpStrategy', 'WHATSAPP_FOLLOWUP_SUCCESS', {
        jobId: job.id,
        messageId: result.messageId,
        durationMs: Date.now() - start,
      });
    } catch (error) {
      // ==================================================
      // FAILURE TRACKING
      // ==================================================
      await this.metrics.recordFailed({ followUpType: job.type });

      this.loggerService.info('WhatsappFollowUpStrategy', 'WHATSAPP_FOLLOWUP_FAILED', {
        jobId: job.id,
        error: error instanceof Error ? error.message : 'unknown',
      });

      this.logger.error(
        `[WHATSAPP_STRATEGY] failed job=${job.id}`,
        error as any,
      );

      throw error; // lets worker retry engine handle it
    }
  }

  /**
   * MESSAGE BUILDER
   * (context-aware but NOT AI generation)
   */
  private buildMessage(job: FollowUpJobEntity): string {
    const payload = job.payload || {};

    switch (job.type) {
      case 'ABANDONED_CART':
        return this.buildAbandonedCartMessage(payload);

      case 'PAYMENT_RETRY':
        return this.buildPaymentRetryMessage(payload);

      case 'CHECKOUT_RESUME':
        return this.buildCheckoutResumeMessage(payload);

      case 'ORDER_REMINDER':
        return this.buildOrderReminderMessage(payload);

      case 'REACTIVATION':
        return this.buildReactivationMessage(payload);

      default:
        return this.buildDefaultMessage(payload);
    }
  }

  // ==================================================
  // MESSAGE TEMPLATES
  // ==================================================

  private buildAbandonedCartMessage(payload: any): string {
    return (
      `Hey 👋 you left something in your cart.\n\n` +
      `We saved it for you so you can finish checkout anytime.\n\n` +
      `Tap to continue → ${payload.checkoutLink || ''}`
    );
  }

  private buildPaymentRetryMessage(payload: any): string {
    return (
      `⚠️ Your payment didn’t go through.\n\n` +
      `Reason: ${payload.reason || 'unknown'}\n\n` +
      `You can retry here → ${payload.retryLink || ''}`
    );
  }

  private buildCheckoutResumeMessage(payload: any): string {
    return (
      `🛒 Your checkout is still waiting.\n\n` +
      `Continue where you left off → ${payload.checkoutLink || ''}`
    );
  }

  private buildOrderReminderMessage(payload: any): string {
    return (
      `📦 Reminder about your order.\n\n` +
      `Order ID: ${payload.orderId || 'N/A'}\n\n` +
      `Track it here → ${payload.trackingLink || ''}`
    );
  }

  private buildReactivationMessage(payload: any): string {
    return (
      `👋 We miss you!\n\n` +
      `Come back and see what's new.\n\n` +
      `${payload.ctaLink || ''}`
    );
  }

  private buildDefaultMessage(payload: any): string {
    return `You have an update waiting for you.`;
  }
}