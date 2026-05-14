// FILE: src/modules/follow-up-engine/application/services/follow-up-cancel.service.ts

import { Injectable } from '@nestjs/common';

import { FollowUpType } from '../../domain/enums/follow-up-type.enum';

import { FollowUpRepository } from '../../domain/repositories/follow-up.repository';

import { FollowUpQueue } from '../../infrastructure/queue/follow-up.queue';

import { FollowUpLoggerService } from '../../infrastructure/observability/follow-up-logger.service';
import { FollowUpMetricsService } from '../../infrastructure/observability/follow-up-metrics.service';

/**
 * FollowUpCancelService
 * -------------------------------------------------------
 * CANCELS OBSOLETE FOLLOW-UPS.
 *
 * Responsibilities:
 * - cancel stale reminders
 * - prevent duplicate recovery flows
 * - stop reminders after successful recovery
 * - synchronize queue + persistence state
 *
 * IMPORTANT:
 * Prevents embarrassing follow-ups like:
 * - "Complete payment" after payment succeeded
 * - "Resume checkout" after order completed
 * - "We miss you" after user already returned
 */

export interface CancelFollowUpsInput {
  tenantId: string;
  userId: string;

  types?: FollowUpType[];

  reason:
    | 'PAYMENT_CONFIRMED'
    | 'ORDER_COMPLETED'
    | 'CHECKOUT_RESUMED'
    | 'USER_REPLIED'
    | 'MANUAL_CANCELLATION'
    | 'SYSTEM_RECOVERY';

  metadata?: Record<string, any>;
}

export interface CancelFollowUpsResult {
  cancelledCount: number;

  cancelledFollowUpIds: string[];
}

@Injectable()
export class FollowUpCancelService {
  constructor(
    // ==================================================
    // REPOSITORY
    // ==================================================

    private readonly repository: FollowUpRepository,

    // ==================================================
    // QUEUE
    // ==================================================

    private readonly queue: FollowUpQueue,

    // ==================================================
    // OBSERVABILITY
    // ==================================================

    private readonly logger: FollowUpLoggerService,

    private readonly metrics: FollowUpMetricsService,
  ) {}

  // ==================================================
  // 🚦 MAIN ENTRY
  // ==================================================

  async cancel(
    input: CancelFollowUpsInput,
  ): Promise<CancelFollowUpsResult> {
    // ==================================================
    // 🔍 LOAD USER FOLLOW-UPS
    // ==================================================

    const followUps =
      await this.repository.findByUser(
        input.tenantId,
        input.userId,
      );

    // ==================================================
    // 🎯 FILTER ACTIVE FOLLOW-UPS
    // ==================================================

    const activeFollowUps =
      followUps.filter(
        (job) => {
          const isActive =
            !job.completedAt &&
            !job.cancelledAt;

          const typeMatches =
            !input.types ||
            input.types.includes(
              job.type,
            );

          return (
            isActive &&
            typeMatches
          );
        },
      );

    // ==================================================
    // ❌ NOTHING TO CANCEL
    // ==================================================

    if (
      activeFollowUps.length === 0
    ) {
      this.logger.info(
        'FOLLOW_UP_CANCEL_SKIPPED',
        {
          tenantId:
            input.tenantId,

          userId:
            input.userId,

          reason:
            input.reason,
        },
      );

      return {
        cancelledCount: 0,
        cancelledFollowUpIds:
          [],
      };
    }

    // ==================================================
    // 🔄 CANCEL FOLLOW-UPS
    // ==================================================

    const cancelledIds: string[] =
      [];

    for (const followUp of activeFollowUps) {
      // ----------------------------------------------
      // 💾 CANCEL ENTITY
      // ----------------------------------------------

      followUp.cancel(
        input.reason,
      );

      await this.repository.update(
        followUp,
      );

      // ----------------------------------------------
      // 🚫 REMOVE QUEUE JOB
      // ----------------------------------------------

      await this.queue.cancel(
        followUp.id,
      );

      cancelledIds.push(
        followUp.id,
      );

      // ----------------------------------------------
      // 📊 METRICS
      // ----------------------------------------------

      await this.metrics.recordCancelled(
        {
          type: followUp.type,
          reason:
            input.reason,
        },
      );

      // ----------------------------------------------
      // 📝 LOGGING
      // ----------------------------------------------

      this.logger.info(
        'FOLLOW_UP_CANCELLED',
        {
          followUpId:
            followUp.id,

          tenantId:
            input.tenantId,

          userId:
            input.userId,

          type:
            followUp.type,

          reason:
            input.reason,
        },
      );
    }

    return {
      cancelledCount:
        cancelledIds.length,

      cancelledFollowUpIds:
        cancelledIds,
    };
  }

  // ==================================================
  // 💳 PAYMENT SUCCESS SHORTCUT
  // ==================================================

  async cancelPaymentFollowUps(
    tenantId: string,
    userId: string,
  ) {
    return this.cancel({
      tenantId,
      userId,

      reason:
        'PAYMENT_CONFIRMED',

      types: [
        FollowUpType.PAYMENT_RETRY,
        FollowUpType.CHECKOUT_RESUME,
        FollowUpType.ABANDONED_CART,
      ],
    });
  }

  // ==================================================
  // 📦 ORDER COMPLETION SHORTCUT
  // ==================================================

  async cancelOrderFollowUps(
    tenantId: string,
    userId: string,
  ) {
    return this.cancel({
      tenantId,
      userId,

      reason:
        'ORDER_COMPLETED',
    });
  }

  // ==================================================
  // 🛒 CHECKOUT RESUMED SHORTCUT
  // ==================================================

  async cancelCheckoutRecoveryFollowUps(
    tenantId: string,
    userId: string,
  ) {
    return this.cancel({
      tenantId,
      userId,

      reason:
        'CHECKOUT_RESUMED',

      types: [
        FollowUpType.ABANDONED_CART,
        FollowUpType.CHECKOUT_RESUME,
      ],
    });
  }

  // ==================================================
  // 💬 USER REPLIED SHORTCUT
  // ==================================================

  async cancelOnUserReply(
    tenantId: string,
    userId: string,
  ) {
    return this.cancel({
      tenantId,
      userId,

      reason:
        'USER_REPLIED',
    });
  }
}