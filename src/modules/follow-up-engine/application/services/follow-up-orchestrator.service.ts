// FILE: src/modules/follow-up-engine/application/services/follow-up-orchestrator.service.ts

import { Injectable } from '@nestjs/common';

import { FollowUpType } from '../../domain/enums/follow-up-type.enum';

import { FollowUpJobEntity } from '../../domain/entities/follow-up-job.entity';

import { FollowUpRepository } from '../../domain/repositories/follow-up.repository';

import {
  FollowUpDecisionEngine,
  FollowUpDecisionInput,
} from '../engines/follow-up-decision.engine';

import {
  FollowUpSchedulerEngine,
  FollowUpScheduleInput,
} from '../engines/follow-up-scheduler.engine';

import {
  FollowUpPersonalizationEngine,
  BuildFollowUpPayloadInput,
} from '../engines/follow-up-personalization.engine';

import { FollowUpQueue } from '../../infrastructure/queue/follow-up.queue';

import { FollowUpLoggerService } from '../../infrastructure/observability/follow-up-logger.service';
import { FollowUpMetricsService } from '../../infrastructure/observability/follow-up-metrics.service';

import { FollowUpTriggerVO } from '../../domain/value-objects/follow-up-trigger.vo';
import { FollowUpScheduleVO } from '../../domain/value-objects/follow-up-schedule.vo';

/**
 * FollowUpOrchestratorService
 * -------------------------------------------------------
 * MAIN ENTRY POINT OF THE FOLLOW-UP ENGINE.
 *
 * Responsibilities:
 * - validate follow-up creation
 * - execute decision engine
 * - compute scheduling
 * - build personalization payload
 * - persist follow-up jobs
 * - enqueue delayed execution
 * - centralize observability
 *
 * IMPORTANT:
 * EVERYTHING flows through here.
 */

export interface CreateFollowUpInput {
  tenantId: string;
  userId: string;

  type: FollowUpType;

  channel: string;

  trigger: FollowUpTriggerVO;

  // ==================================================
  // OPTIONAL BUSINESS CONTEXT
  // ==================================================

  customerName?: string;

  cart?: {
    items?: Array<{
      productId?: string;
      name?: string;
      quantity?: number;
      price?: number;
    }>;

    totalAmount?: number;

    currency?: string;
  };

  payment?: {
    paymentId?: string;

    amount?: number;

    currency?: string;

    failureReason?: string;

    retryUrl?: string;
  };

  order?: {
    orderId?: string;

    status?: string;

    estimatedDeliveryAt?: Date;

    totalAmount?: number;
  };

  conversation?: {
    lastMessage?: string;

    lastIntent?: string;

    lastInteractionAt?: Date;
  };

  metadata?: Record<string, any>;
}

export interface CreateFollowUpResult {
  created: boolean;

  skipped: boolean;

  reason?: string;

  followUpId?: string;

  scheduledAt?: Date;
}

@Injectable()
export class FollowUpOrchestratorService {
  constructor(
    // ==================================================
    // ENGINES
    // ==================================================

    private readonly decisionEngine: FollowUpDecisionEngine,

    private readonly schedulerEngine: FollowUpSchedulerEngine,

    private readonly personalizationEngine: FollowUpPersonalizationEngine,

    // ==================================================
    // PERSISTENCE
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

  async createFollowUp(
    input: CreateFollowUpInput,
  ): Promise<CreateFollowUpResult> {
    // ==================================================
    // 🧠 DECISION PHASE
    // ==================================================

    const decisionInput: FollowUpDecisionInput = {
      tenantId: input.tenantId,
      userId: input.userId,
      type: input.type,
      metadata: input.metadata,
    };

    const decision =
      await this.decisionEngine.shouldCreate(
        decisionInput,
      );

    if (!decision.allowed) {
      this.logger.warn(
        'FOLLOW_UP_SKIPPED',
        {
          tenantId: input.tenantId,
          userId: input.userId,
          type: input.type,
          reason: decision.reason,
        },
      );

      return {
        created: false,
        skipped: true,
        reason: decision.reason,
      };
    }

    // ==================================================
    // ⏰ SCHEDULING PHASE
    // ==================================================

    const scheduleInput: FollowUpScheduleInput = {
      type: input.type,
      metadata: input.metadata,
    };

    const schedule: FollowUpScheduleVO =
      this.schedulerEngine.compute(
        scheduleInput,
      );

    // ==================================================
    // 🧩 PERSONALIZATION PHASE
    // ==================================================

    const personalizationInput: BuildFollowUpPayloadInput =
      {
        tenantId: input.tenantId,
        userId: input.userId,
        type: input.type,
        trigger: input.trigger,

        customerName:
          input.customerName,

        cart: input.cart,

        payment: input.payment,

        order: input.order,

        conversation:
          input.conversation,

        metadata: input.metadata,
      };

    const personalization =
      this.personalizationEngine.build(
        personalizationInput,
      );

    // ==================================================
    // 🏗️ BUILD FOLLOW-UP ENTITY
    // ==================================================

    const followUp =
      FollowUpJobEntity.create({
        tenantId: input.tenantId,
        userId: input.userId,

        type: input.type,

        channel: input.channel,

        scheduledAt:
          schedule.scheduledAt,

        payload: {
          ...personalization,
        },

        trigger: input.trigger,

        metadata: {
          ...input.metadata,

          delayMs:
            schedule.delayMs,
        },
      });

    // ==================================================
    // 💾 PERSIST FOLLOW-UP
    // ==================================================

    await this.repository.create(
      followUp,
    );

    // ==================================================
    // 🚀 ENQUEUE EXECUTION
    // ==================================================

    await this.queue.schedule({
      followUpId: followUp.id,

      tenantId: input.tenantId,

      userId: input.userId,

      scheduledAt:
        schedule.scheduledAt,

      delayMs:
        schedule.delayMs,
    });

    // ==================================================
    // 📊 METRICS
    // ==================================================

    await this.metrics.recordScheduled({
      type: input.type,
      channel: input.channel,
    });

    // ==================================================
    // 📝 LOGGING
    // ==================================================

    this.logger.info(
      'FOLLOW_UP_CREATED',
      {
        followUpId: followUp.id,

        tenantId: input.tenantId,

        userId: input.userId,

        type: input.type,

        scheduledAt:
          schedule.scheduledAt,
      },
    );

    return {
      created: true,

      skipped: false,

      followUpId:
        followUp.id,

      scheduledAt:
        schedule.scheduledAt,
    };
  }
}