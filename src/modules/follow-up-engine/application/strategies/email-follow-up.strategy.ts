// FILE: src/modules/follow-up-engine/application/strategies/email-follow-up.strategy.ts

import { Injectable, Logger } from '@nestjs/common';

import { FollowUpJobEntity } from '../../domain/entities/follow-up-job.entity';
import { FollowUpLoggerService } from '../../infrastructure/observability/follow-up-logger.service';
import { FollowUpMetricsService } from '../../infrastructure/observability/follow-up-metrics.service';

/**
 * EMAIL FOLLOW-UP STRATEGY (FUTURE CHANNEL)
 * -----------------------------------------------------
 * High-context, rich follow-up delivery channel.
 *
 * Use cases:
 * - reactivation campaigns
 * - long-form reminders
 * - abandoned cart recovery (detailed)
 * - onboarding sequences
 *
 * IMPORTANT:
 * Email = template + structure + optional HTML support
 */

export interface EmailSenderPort {
  sendEmail(input: {
    tenantId: string;
    userId: string;
    email?: string;
    subject: string;
    body: string;
    metadata?: Record<string, any>;
  }): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }>;
}

@Injectable()
export class EmailFollowUpStrategy {
  private readonly logger = new Logger(EmailFollowUpStrategy.name);

  constructor(
    private readonly sender: EmailSenderPort,
    private readonly loggerService: FollowUpLoggerService,
    private readonly metrics: FollowUpMetricsService,
  ) {}

  /**
   * MAIN ENTRY POINT
   */
  async execute(job: FollowUpJobEntity): Promise<void> {
    const start = Date.now();

    this.loggerService.log('EMAIL_FOLLOWUP_START', {
      jobId: job.id,
      userId: job.userId,
      type: job.type,
    });

    try {
      // ==================================================
      // 1. BUILD EMAIL CONTENT
      // ==================================================
      const email = this.buildEmail(job);

      // ==================================================
      // 2. SEND EMAIL
      // ==================================================
      const result = await this.sender.sendEmail({
        tenantId: job.tenantId,
        userId: job.userId,
        email: job.payload?.email,
        subject: email.subject,
        body: email.body,
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
        throw new Error(result.error || 'Email send failed');
      }

      // ==================================================
      // 4. METRICS
      // ==================================================
      await this.metrics.incrementDelivered(job.type);

      this.loggerService.log('EMAIL_FOLLOWUP_SUCCESS', {
        jobId: job.id,
        messageId: result.messageId,
        durationMs: Date.now() - start,
      });
    } catch (error) {
      // ==================================================
      // FAILURE HANDLING
      // ==================================================
      await this.metrics.incrementFailed(job.type);

      this.loggerService.log('EMAIL_FOLLOWUP_FAILED', {
        jobId: job.id,
        error: error instanceof Error ? error.message : 'unknown',
      });

      this.logger.error(
        `[EMAIL_STRATEGY] failed job=${job.id}`,
        error as any,
      );

      throw error; // allow retry system (BullMQ)
    }
  }

  // ==================================================
  // EMAIL BUILDER (STRUCTURED + RICH CONTENT)
  // ==================================================
  private buildEmail(job: FollowUpJobEntity): {
    subject: string;
    body: string;
  } {
    const payload = job.payload || {};

    switch (job.type) {
      case 'ABANDONED_CART':
        return {
          subject: 'You left something in your cart 🛒',
          body: this.buildAbandonedCartEmail(payload),
        };

      case 'PAYMENT_RETRY':
        return {
          subject: 'Payment failed — action required ⚠️',
          body: this.buildPaymentRetryEmail(payload),
        };

      case 'CHECKOUT_RESUME':
        return {
          subject: 'Complete your checkout',
          body: this.buildCheckoutResumeEmail(payload),
        };

      case 'ORDER_REMINDER':
        return {
          subject: 'Your order update 📦',
          body: this.buildOrderReminderEmail(payload),
        };

      case 'REACTIVATION':
        return {
          subject: 'We miss you 👋',
          body: this.buildReactivationEmail(payload),
        };

      default:
        return {
          subject: 'You have an update',
          body: 'Please check your account for updates.',
        };
    }
  }

  // ==================================================
  // EMAIL TEMPLATES (RICH TEXT / HTML READY)
  // ==================================================

  private buildAbandonedCartEmail(payload: any): string {
    return `
      <h2>🛒 You left items in your cart</h2>
      <p>We saved your cart so you can complete your purchase anytime.</p>
      <a href="${payload.checkoutLink || '#'}">Complete Checkout</a>
    `;
  }

  private buildPaymentRetryEmail(payload: any): string {
    return `
      <h2>⚠️ Payment Failed</h2>
      <p><strong>Reason:</strong> ${payload.reason || 'unknown'}</p>
      <p>Please retry your payment below:</p>
      <a href="${payload.retryLink || '#'}">Retry Payment</a>
    `;
  }

  private buildCheckoutResumeEmail(payload: any): string {
    return `
      <h2>Continue Your Checkout</h2>
      <p>You were almost done!</p>
      <a href="${payload.checkoutLink || '#'}">Resume Checkout</a>
    `;
  }

  private buildOrderReminderEmail(payload: any): string {
    return `
      <h2>📦 Order Reminder</h2>
      <p>Your order ID: ${payload.orderId || 'N/A'}</p>
      <a href="${payload.trackingLink || '#'}">Track Order</a>
    `;
  }

  private buildReactivationEmail(payload: any): string {
    return `
      <h2>👋 We miss you</h2>
      <p>Come back and see what's new.</p>
      <a href="${payload.ctaLink || '#'}">Return Now</a>
    `;
  }
}