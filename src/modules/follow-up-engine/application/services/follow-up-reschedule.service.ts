// FILE: src/modules/follow-up-engine/application/services/follow-up-reschedule.service.ts

import { Injectable } from '@nestjs/common';

import { FollowUpRepository } from '../../domain/repositories/follow-up.repository';

import { FollowUpScheduleVO } from '../../domain/value-objects/follow-up-schedule.vo';

import {
  FollowUpSchedulerEngine,
  FollowUpScheduleInput,
} from '../engines/follow-up-scheduler.engine';

import { FollowUpQueue } from '../../infrastructure/queue/follow-up.queue';

import { FollowUpLoggerService } from '../../infrastructure/observability/follow-up-logger.service';
import { FollowUpMetricsService } from '../../infrastructure/observability/follow-up-metrics.service';

/**
 * FollowUpRescheduleService
 * -------------------------------------------------------
 * DYNAMICALLY MOVES FOLLOW-UP EXECUTION WINDOWS.
 *
 * Responsibilities:
 * - delay reminders
 * - extend retry windows
 * - shift follow-up execution
 * - synchronize queue + persistence
 *
 * Examples:
 * - user becomes active again
 * - payment retry cooldown extended
 * - checkout restarted
 * - session recovered
 */

export interface RescheduleFollowUpInput {
  followUpId: string;

  reason:
    | 'USER_ACTIVE_AGAIN'
    | 'PAYMENT_WINDOW_EXTENDED'
    | 'CHECKOUT_RESTARTED'
    | 'RECOVERY_EXTENDED'
    | 'MANUAL_RESCHEDULE';

  // ==================================================
  // OPTIONAL MANUAL OVERRIDE
  // ==================================================

  delayMs?: number;

  scheduledAt?: Date;

  metadata?: Record<string, any>;
}

export interface RescheduleFollowUpResult {
  success: boolean;

  previousScheduledAt: Date;

  newScheduledAt: Date;

  delayMs: number;
}

@Injectable()
export class FollowUpRescheduleService {
  constructor(
    // ==================================================
    // REPOSITORY
    // ==================================================

    private readonly repository: FollowUpRepository,

    // ==================================================
    // SCHEDULING ENGINE
    // ==================================================

    private readonly schedulerEngine: FollowUpSchedulerEngine,

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

  async reschedule(
    input: RescheduleFollowUpInput,
  ): Promise<RescheduleFollowUpResult> {
    // ==================================================
    // 🔍 LOAD FOLLOW-UP
    // ==================================================

    const followUp =
      await this.repository.findById(
        input.followUpId,
      );

    if (!followUp) {
      throw new Error(
        `Follow-up not found: ${input.followUpId}`,
      );
    }

    // ==================================================
    // 🚫 VALIDATE ACTIVE STATE
    // ==================================================

    if (
      followUp.cancelledAt ||
      followUp.completedAt
    ) {
      throw new Error(
        'Cannot reschedule inactive follow-up',
      );
    }

    const previousScheduledAt =
      followUp.scheduledAt;

    // ==================================================
    // ⏰ RESOLVE NEW SCHEDULE
    // ==================================================

    let schedule:
      | FollowUpScheduleVO
      | undefined;

    // ----------------------------------------------
    // MANUAL OVERRIDE
    // ----------------------------------------------

    if (
      input.delayMs !== undefined ||
      input.scheduledAt
    ) {
      schedule =
        FollowUpScheduleVO.create({
          delayMs:
            input.delayMs ??
            Math.max(
              input.scheduledAt!.getTime() -
                Date.now(),
              0,
            ),

          scheduledAt:
            input.scheduledAt ??
            new Date(
              Date.now() +
                (input.delayMs ?? 0),
            ),
        });
    }

    // ----------------------------------------------
    // DYNAMIC ENGINE COMPUTATION
    // ----------------------------------------------

    else {
      const schedulingInput: FollowUpScheduleInput =
        {
          type: followUp.type,

          metadata: {
            ...followUp.metadata,

            rescheduleReason:
              input.reason,
          },
        };

      schedule =
        this.schedulerEngine.compute(
          schedulingInput,
        );
    }

    // ==================================================
    // 🔄 UPDATE ENTITY
    // ==================================================

    followUp.reschedule(
      schedule.scheduledAt,
    );

    // ==================================================
    // 💾 PERSIST CHANGES
    // ==================================================

    await this.repository.update(
      followUp,
    );

    // ==================================================
    // 🔁 UPDATE QUEUE
    // ==================================================

    await this.queue.reschedule({
      followUpId:
        followUp.id,

      scheduledAt:
        schedule.scheduledAt,

      delayMs:
        schedule.delayMs,
    });

    // ==================================================
    // 📊 METRICS
    // ==================================================

    await this.metrics.recordRescheduled(
      {
        type: followUp.type,

        reason:
          input.reason,
      },
    );

    // ==================================================
    // 📝 LOGGING
    // ==================================================

    this.logger.info(
      'FOLLOW_UP_RESCHEDULED',
      {
        followUpId:
          followUp.id,

        tenantId:
          followUp.tenantId,

        userId:
          followUp.userId,

        type:
          followUp.type,

        reason:
          input.reason,

        previousScheduledAt,

        newScheduledAt:
          schedule.scheduledAt,
      },
    );

    return {
      success: true,

      previousScheduledAt,

      newScheduledAt:
        schedule.scheduledAt,

      delayMs:
        schedule.delayMs,
    };
  }

  // ==================================================
  // 👤 USER ACTIVE AGAIN
  // ==================================================

  async delayBecauseUserReturned(
    followUpId: string,
  ) {
    return this.reschedule({
      followUpId,

      reason:
        'USER_ACTIVE_AGAIN',

      delayMs:
        1000 * 60 * 30, // +30 min
    });
  }

  // ==================================================
  // 💳 PAYMENT WINDOW EXTENDED
  // ==================================================

  async extendPaymentRetryWindow(
    followUpId: string,
  ) {
    return this.reschedule({
      followUpId,

      reason:
        'PAYMENT_WINDOW_EXTENDED',

      delayMs:
        1000 * 60 * 15, // +15 min
    });
  }

  // ==================================================
  // 🛒 CHECKOUT RESTARTED
  // ==================================================

  async restartCheckoutRecoveryWindow(
    followUpId: string,
  ) {
    return this.reschedule({
      followUpId,

      reason:
        'CHECKOUT_RESTARTED',

      delayMs:
        1000 * 60 * 20, // +20 min
    });
  }
}