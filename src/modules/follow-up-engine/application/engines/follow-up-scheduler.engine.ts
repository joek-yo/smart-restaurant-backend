// FILE: src/modules/follow-up-engine/application/engines/follow-up-scheduler.engine.ts

import { Injectable } from '@nestjs/common';

import { FollowUpType } from '../../domain/enums/follow-up-type.enum';

import { FollowUpScheduleVO } from '../../domain/value-objects/follow-up-schedule.vo';

import { FollowUpLoggerService } from '../../infrastructure/observability/follow-up-logger.service';

/**
 * FollowUpSchedulerEngine
 * -------------------------------------------------------
 * SCHEDULING INTELLIGENCE LAYER.
 *
 * Responsibilities:
 * - compute WHEN follow-up executes
 * - centralize timing rules
 * - support retry windows
 * - prevent invalid scheduling
 * - support future timezone logic
 *
 * IMPORTANT:
 * This engine ONLY computes time.
 * It NEVER queues jobs.
 */

export interface FollowUpSchedulingInput {
  tenantId: string;

  userId: string;

  followUpType: FollowUpType;

  workflowType?:
    | 'conversation'
    | 'session'
    | 'checkout'
    | 'payment'
    | 'order';

  retryCount?: number;

  timezone?: string;

  triggerAt?: Date;

  metadata?: Record<string, any>;
}

@Injectable()
export class FollowUpSchedulerEngine {
  // ==================================================
  // ⏱️ DEFAULT DELAYS
  // ==================================================

  private readonly DEFAULT_DELAYS = {
    // 15 minutes
    ABANDONED_CART:
      1000 * 60 * 15,

    // 5 minutes
    PAYMENT_RETRY:
      1000 * 60 * 5,

    // 10 minutes
    CHECKOUT_RESUME:
      1000 * 60 * 10,

    // 2 hours
    ORDER_REMINDER:
      1000 * 60 * 60 * 2,

    // 3 days
    REACTIVATION:
      1000 * 60 * 60 * 24 * 3,
  };

  // ==================================================
  // 🔁 RETRY BACKOFFS
  // ==================================================

  private readonly RETRY_MULTIPLIERS = {
    0: 1,
    1: 2,
    2: 4,
    3: 8,
  };

  constructor(
    private readonly logger: FollowUpLoggerService,
  ) {}

  // ==================================================
  // 🚦 MAIN ENTRY
  // ==================================================

  computeSchedule(
    input: FollowUpSchedulingInput,
  ): FollowUpScheduleVO {
    const triggerAt =
      input.triggerAt ?? new Date();

    const retryCount =
      input.retryCount ?? 0;

    const baseDelay =
      this.resolveBaseDelay(
        input.followUpType,
      );

    const retryMultiplier =
      this.resolveRetryMultiplier(
        retryCount,
      );

    const finalDelayMs =
      baseDelay * retryMultiplier;

    const scheduledAt =
      new Date(
        triggerAt.getTime() +
          finalDelayMs,
      );

    const schedule =
      new FollowUpScheduleVO({
        scheduledAt,
        delayMs: finalDelayMs,
        retryWindowMs:
          finalDelayMs * 2,
        timezone:
          input.timezone ?? 'UTC',
      });

    // ==================================================
    // 🛰️ OBSERVABILITY
    // ==================================================

    this.logger.info(
      'FollowUpSchedulerEngine',
      'FOLLOW_UP_SCHEDULE_COMPUTED',
      {
        tenantId: input.tenantId,
        userId: input.userId,
        workflowType:
          input.workflowType,
        followUpType:
          input.followUpType,
        metadata: {
          retryCount,
          baseDelay,
          retryMultiplier,
          finalDelayMs,
          scheduledAt:
            scheduledAt.toISOString(),
        },
      },
    );

    return schedule;
  }

  // ==================================================
  // ⏱️ BASE DELAY RESOLUTION
  // ==================================================

  private resolveBaseDelay(
    type: FollowUpType,
  ): number {
    switch (type) {
      case FollowUpType.ABANDONED_CART:
        return this.DEFAULT_DELAYS
          .ABANDONED_CART;

      case FollowUpType.PAYMENT_RETRY:
        return this.DEFAULT_DELAYS
          .PAYMENT_RETRY;

      case FollowUpType.CHECKOUT_RESUME:
        return this.DEFAULT_DELAYS
          .CHECKOUT_RESUME;

      case FollowUpType.ORDER_REMINDER:
        return this.DEFAULT_DELAYS
          .ORDER_REMINDER;

      case FollowUpType.REACTIVATION:
        return this.DEFAULT_DELAYS
          .REACTIVATION;

      default:
        return 1000 * 60 * 15;
    }
  }

  // ==================================================
  // 🔁 RETRY MULTIPLIER
  // ==================================================

  private resolveRetryMultiplier(
    retryCount: number,
  ): number {
    if (
      retryCount in
      this.RETRY_MULTIPLIERS
    ) {
      return this
        .RETRY_MULTIPLIERS[
        retryCount as keyof typeof this.RETRY_MULTIPLIERS
      ];
    }

    return 10;
  }
}