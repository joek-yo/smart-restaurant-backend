import { Injectable } from '@nestjs/common';
import { FollowUpType } from '../../domain/enums/follow-up-type.enum';
import { FollowUpJobEntity } from '../../domain/entities/follow-up-job.entity';
import { FollowUpRepository } from '../../domain/repositories/follow-up.repository';
import { FollowUpDecisionEngine, FollowUpDecisionInput } from '../engines/follow-up-decision.engine';
import { FollowUpSchedulerEngine, FollowUpSchedulingInput } from '../engines/follow-up-scheduler.engine';
import { FollowUpPersonalizationEngine, BuildFollowUpPayloadInput } from '../engines/follow-up-personalization.engine';
import { FollowUpQueue } from '../../infrastructure/queue/follow-up.queue';
import { FollowUpLoggerService } from '../../infrastructure/observability/follow-up-logger.service';
import { FollowUpMetricsService } from '../../infrastructure/observability/follow-up-metrics.service';
import { FollowUpTriggerVO } from '../../domain/value-objects/follow-up-trigger.vo';
import { FollowUpScheduleVO } from '../../domain/value-objects/follow-up-schedule.vo';

export interface CreateFollowUpInput {
  tenantId: string; userId: string; type: FollowUpType; channel: string;
  trigger: FollowUpTriggerVO; customerName?: string;
  cart?: { items?: Array<{ productId?: string; name?: string; quantity?: number; price?: number }>; totalAmount?: number; currency?: string };
  payment?: { paymentId?: string; amount?: number; currency?: string; failureReason?: string; retryUrl?: string };
  order?: { orderId?: string; status?: string; estimatedDeliveryAt?: Date; totalAmount?: number };
  conversation?: { lastMessage?: string; lastIntent?: string; lastInteractionAt?: Date };
  metadata?: Record<string, any>;
}
export interface CreateFollowUpResult {
  created: boolean; skipped: boolean; reason?: string; followUpId?: string; scheduledAt?: Date;
}

@Injectable()
export class FollowUpOrchestratorService {
  constructor(
    private readonly decisionEngine: FollowUpDecisionEngine,
    private readonly schedulerEngine: FollowUpSchedulerEngine,
    private readonly personalizationEngine: FollowUpPersonalizationEngine,
    private readonly repository: FollowUpRepository,
    private readonly queue: FollowUpQueue,
    private readonly logger: FollowUpLoggerService,
    private readonly metrics: FollowUpMetricsService,
  ) {}

  async createFollowUp(input: CreateFollowUpInput): Promise<CreateFollowUpResult> {
    const decisionInput: FollowUpDecisionInput = {
      tenantId: input.tenantId, userId: input.userId,
      workflowType: 'conversation', followUpType: input.type,
      metadata: input.metadata,
    };
    const decision = await this.decisionEngine.decide(decisionInput);
    if (!decision.allowed) {
      this.logger.warn('FollowUpOrchestratorService', 'FOLLOW_UP_SKIPPED', { tenantId: input.tenantId, userId: input.userId });
      return { created: false, skipped: true, reason: decision.reason };
    }
    const scheduleInput: FollowUpSchedulingInput = {
      tenantId: input.tenantId, userId: input.userId,
      followUpType: input.type, metadata: input.metadata,
    };
    const schedule: FollowUpScheduleVO = this.schedulerEngine.computeSchedule(scheduleInput);
    const personalizationInput: BuildFollowUpPayloadInput = {
      tenantId: input.tenantId, userId: input.userId, type: input.type,
      trigger: input.trigger, customerName: input.customerName,
      cart: input.cart, payment: input.payment, order: input.order,
      conversation: input.conversation, metadata: input.metadata,
    };
    const personalization = this.personalizationEngine.build(personalizationInput);
    const followUp = new FollowUpJobEntity({
      tenantId: input.tenantId, userId: input.userId, type: input.type,
      channel: input.channel as any, schedule, trigger: input.trigger,
      payload: { ...personalization },
    });
    await this.repository.create(followUp);
    await this.queue.addFollowUpJob({ job: followUp, delayMs: schedule.delayMs });
    await this.metrics.recordScheduled({ followUpType: input.type, channel: input.channel });
    this.logger.info('FollowUpOrchestratorService', 'FOLLOW_UP_CREATED', { followUpJobId: followUp.id, tenantId: input.tenantId, userId: input.userId });
    return { created: true, skipped: false, followUpId: followUp.id, scheduledAt: schedule.scheduledAt };
  }
}
