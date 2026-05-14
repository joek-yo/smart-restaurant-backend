import { Injectable } from '@nestjs/common';
import { FollowUpRepository } from '../../domain/repositories/follow-up.repository';
import { FollowUpScheduleVO } from '../../domain/value-objects/follow-up-schedule.vo';
import { FollowUpSchedulerEngine, FollowUpSchedulingInput } from '../engines/follow-up-scheduler.engine';
import { FollowUpQueue } from '../../infrastructure/queue/follow-up.queue';
import { FollowUpLoggerService } from '../../infrastructure/observability/follow-up-logger.service';
import { FollowUpMetricsService } from '../../infrastructure/observability/follow-up-metrics.service';

export interface RescheduleFollowUpInput {
  followUpId: string;
  reason: 'USER_ACTIVE_AGAIN' | 'PAYMENT_WINDOW_EXTENDED' | 'CHECKOUT_RESTARTED' | 'RECOVERY_EXTENDED' | 'MANUAL_RESCHEDULE';
  delayMs?: number; scheduledAt?: Date; metadata?: Record<string, any>;
}
export interface RescheduleFollowUpResult {
  success: boolean; previousScheduledAt: Date; newScheduledAt: Date; delayMs: number;
}

@Injectable()
export class FollowUpRescheduleService {
  constructor(
    private readonly repository: FollowUpRepository,
    private readonly schedulerEngine: FollowUpSchedulerEngine,
    private readonly queue: FollowUpQueue,
    private readonly logger: FollowUpLoggerService,
    private readonly metrics: FollowUpMetricsService,
  ) {}

  async reschedule(input: RescheduleFollowUpInput): Promise<RescheduleFollowUpResult> {
    const followUp = await this.repository.findById(input.followUpId);
    if (!followUp) throw new Error(`Follow-up not found: ${input.followUpId}`);
    if (followUp.cancelledAt || followUp.completedAt) throw new Error('Cannot reschedule inactive follow-up');

    const previousScheduledAt = followUp.schedule.scheduledAt;
    let schedule: FollowUpScheduleVO;

    if (input.delayMs !== undefined || input.scheduledAt) {
      const delayMs = input.delayMs ?? Math.max((input.scheduledAt!.getTime() - Date.now()), 0);
      const scheduledAt = input.scheduledAt ?? new Date(Date.now() + delayMs);
      schedule = new FollowUpScheduleVO({ delayMs, scheduledAt });
    } else {
      const schedulingInput: FollowUpSchedulingInput = {
        tenantId: followUp.tenantId, userId: followUp.userId,
        followUpType: followUp.type, metadata: { ...followUp.payload, rescheduleReason: input.reason },
      };
      schedule = this.schedulerEngine.computeSchedule(schedulingInput);
    }

    followUp.markScheduled();
    await this.repository.update(followUp);
    await this.queue.reschedule({ followUpId: followUp.id, scheduledAt: schedule.scheduledAt, delayMs: schedule.delayMs });
    await this.metrics.recordRetried({ followUpType: followUp.type });
    this.logger.info('FollowUpRescheduleService', 'FOLLOW_UP_RESCHEDULED', { followUpJobId: followUp.id, tenantId: followUp.tenantId, userId: followUp.userId });

    return { success: true, previousScheduledAt, newScheduledAt: schedule.scheduledAt, delayMs: schedule.delayMs };
  }

  async delayBecauseUserReturned(followUpId: string) { return this.reschedule({ followUpId, reason: 'USER_ACTIVE_AGAIN', delayMs: 1000 * 60 * 30 }); }
  async extendPaymentRetryWindow(followUpId: string) { return this.reschedule({ followUpId, reason: 'PAYMENT_WINDOW_EXTENDED', delayMs: 1000 * 60 * 15 }); }
  async restartCheckoutRecoveryWindow(followUpId: string) { return this.reschedule({ followUpId, reason: 'CHECKOUT_RESTARTED', delayMs: 1000 * 60 * 20 }); }
}
