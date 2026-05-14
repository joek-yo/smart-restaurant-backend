import { Injectable } from '@nestjs/common';
import { FollowUpType } from '../../domain/enums/follow-up-type.enum';
import { FollowUpRepository } from '../../domain/repositories/follow-up.repository';
import { FollowUpQueue } from '../../infrastructure/queue/follow-up.queue';
import { FollowUpLoggerService } from '../../infrastructure/observability/follow-up-logger.service';
import { FollowUpMetricsService } from '../../infrastructure/observability/follow-up-metrics.service';

export interface CancelFollowUpsInput {
  tenantId: string; userId: string;
  types?: FollowUpType[];
  reason: 'PAYMENT_CONFIRMED' | 'ORDER_COMPLETED' | 'CHECKOUT_RESUMED' | 'USER_REPLIED' | 'MANUAL_CANCELLATION' | 'SYSTEM_RECOVERY';
  metadata?: Record<string, any>;
}
export interface CancelFollowUpsResult { cancelledCount: number; cancelledFollowUpIds: string[]; }

@Injectable()
export class FollowUpCancelService {
  constructor(
    private readonly repository: FollowUpRepository,
    private readonly queue: FollowUpQueue,
    private readonly logger: FollowUpLoggerService,
    private readonly metrics: FollowUpMetricsService,
  ) {}

  async cancel(input: CancelFollowUpsInput): Promise<CancelFollowUpsResult> {
    const followUps = await this.repository.findByUser(input.tenantId, input.userId);
    const activeFollowUps = followUps.filter(job => {
      const isActive = !job.completedAt && !job.cancelledAt;
      const typeMatches = !input.types || input.types.includes(job.type);
      return isActive && typeMatches;
    });
    if (activeFollowUps.length === 0) {
      this.logger.info('FollowUpCancelService', 'FOLLOW_UP_CANCEL_SKIPPED', { tenantId: input.tenantId, userId: input.userId });
      return { cancelledCount: 0, cancelledFollowUpIds: [] };
    }
    const cancelledIds: string[] = [];
    for (const followUp of activeFollowUps) {
      followUp.cancel(input.reason);
      await this.repository.update(followUp);
      await this.queue.cancel(followUp.id);
      cancelledIds.push(followUp.id);
      await this.metrics.recordCancelled({ followUpType: followUp.type });
      this.logger.info('FollowUpCancelService', 'FOLLOW_UP_CANCELLED', { followUpJobId: followUp.id, tenantId: input.tenantId, userId: input.userId });
    }
    return { cancelledCount: cancelledIds.length, cancelledFollowUpIds: cancelledIds };
  }

  async cancelPaymentFollowUps(tenantId: string, userId: string) {
    return this.cancel({ tenantId, userId, reason: 'PAYMENT_CONFIRMED', types: [FollowUpType.PAYMENT_RETRY, FollowUpType.CHECKOUT_RESUME, FollowUpType.ABANDONED_CART] });
  }
  async cancelOrderFollowUps(tenantId: string, userId: string) {
    return this.cancel({ tenantId, userId, reason: 'ORDER_COMPLETED' });
  }
  async cancelCheckoutRecoveryFollowUps(tenantId: string, userId: string) {
    return this.cancel({ tenantId, userId, reason: 'CHECKOUT_RESUMED', types: [FollowUpType.ABANDONED_CART, FollowUpType.CHECKOUT_RESUME] });
  }
  async cancelOnUserReply(tenantId: string, userId: string) {
    return this.cancel({ tenantId, userId, reason: 'USER_REPLIED' });
  }
}
