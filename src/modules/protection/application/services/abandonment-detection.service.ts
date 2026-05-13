// FILE: src/modules/protection/application/services/abandonment-detection.service.ts

import { Injectable } from '@nestjs/common';

import { WorkflowStatus } from '../../domain/enums/workflow-status.enum';
import { WorkflowAnomalyType } from '../../domain/enums/workflow-anomaly-type.enum';
import { ProtectionLevel } from '../../domain/enums/protection-level.enum';

import { WorkflowAnomalyEntity } from '../../domain/entities/workflow-anomaly.entity';

import { WorkflowTimelineService } from './workflow-timeline.service';

import { WorkflowCacheRedisRepository } from '../../infrastructure/redis/workflow-cache.redis.repository';

import { ProtectionLoggerService } from '../../infrastructure/observability/protection-logger.service';
import { WorkflowMetricsService } from '../../infrastructure/observability/workflow-metrics.service';

/**
 * AbandonmentDetectionService
 * -------------------------------------------------------
 * Detects abandoned or inactive workflows.
 *
 * Responsibilities:
 * - detect abandoned carts
 * - detect stale conversations
 * - detect inactive checkout flows
 * - detect expired payment attempts
 * - generate abandonment anomalies
 *
 * IMPORTANT:
 * Detection ONLY.
 * Recovery execution is handled elsewhere.
 */

export interface AbandonmentDetectionInput {
  tenantId: string;
  userId: string;

  workflowType:
    | 'conversation'
    | 'session'
    | 'checkout'
    | 'payment'
    | 'order';

  currentState?: string;

  lastActivityAt: Date;

  timeoutMs?: number;

  metadata?: Record<string, any>;
}

export interface AbandonmentDetectionResult {
  abandoned: boolean;

  workflowStatus: WorkflowStatus;

  inactiveDurationMs: number;

  thresholdMs: number;

  anomaly?: WorkflowAnomalyEntity;

  protectionLevel?: ProtectionLevel;
}

@Injectable()
export class AbandonmentDetectionService {
  // ==================================================
  // ⏱️ DEFAULT TIMEOUTS
  // ==================================================

  private readonly DEFAULT_TIMEOUTS = {
    conversation: 1000 * 60 * 30, // 30 min
    session: 1000 * 60 * 60, // 1 hour
    checkout: 1000 * 60 * 15, // 15 min
    payment: 1000 * 60 * 10, // 10 min
    order: 1000 * 60 * 60 * 24, // 24h
  };

  constructor(
    private readonly workflowCache: WorkflowCacheRedisRepository,

    private readonly timelineService: WorkflowTimelineService,

    private readonly metricsService: WorkflowMetricsService,

    private readonly logger: ProtectionLoggerService,
  ) {}

  // ==================================================
  // 🚦 MAIN DETECTION ENTRY POINT
  // ==================================================

  async detect(
    input: AbandonmentDetectionInput,
  ): Promise<AbandonmentDetectionResult> {
    const now = Date.now();

    const lastActivity =
      new Date(input.lastActivityAt).getTime();

    const inactiveDurationMs =
      now - lastActivity;

    const thresholdMs =
      input.timeoutMs ??
      this.DEFAULT_TIMEOUTS[input.workflowType];

    // ==================================================
    // ✅ STILL ACTIVE
    // ==================================================

    if (inactiveDurationMs < thresholdMs) {
      return {
        abandoned: false,
        workflowStatus: WorkflowStatus.HEALTHY,
        inactiveDurationMs,
        thresholdMs,
      };
    }

    // ==================================================
    // 🚨 ABANDONMENT DETECTED
    // ==================================================

    const anomaly =
      this.buildAbandonmentAnomaly(
        input,
        inactiveDurationMs,
      );

    // ==================================================
    // 💾 CACHE ABANDONMENT STATE
    // ==================================================

    await this.workflowCache.setWorkflowState({
      tenantId: input.tenantId,
      userId: input.userId,
      workflowType: input.workflowType,
      state: 'ABANDONED',
      metadata: {
        inactiveDurationMs,
        detectedAt: new Date(),
      },
    });

    // ==================================================
    // 📝 RECORD TIMELINE EVENT
    // ==================================================

    await this.timelineService.recordEvent({
      tenantId: input.tenantId,
      userId: input.userId,
      workflowType: input.workflowType,
      event: 'WORKFLOW_ABANDONED',
      state: input.currentState,
      metadata: {
        inactiveDurationMs,
        thresholdMs,
      },
    });

    // ==================================================
    // 📊 METRICS
    // ==================================================

    await this.metricsService.recordWorkflowAbandonment({
      workflowType: input.workflowType,
      inactiveDurationMs,
    });

    // ==================================================
    // 📝 OBSERVABILITY
    // ==================================================

    this.logger.warn(
      'AbandonmentDetectionService',
      'WORKFLOW_ABANDONED',
      {
        tenantId: input.tenantId,
        userId: input.userId,
        metadata: {
          workflowType: input.workflowType,
          inactiveDurationMs,
          thresholdMs,
        },
      },
    );

    return {
      abandoned: true,
      workflowStatus: WorkflowStatus.ABANDONED,
      inactiveDurationMs,
      thresholdMs,
      anomaly,
      protectionLevel: this.resolveProtectionLevel(
        input.workflowType,
      ),
    };
  }

  // ==================================================
  // 🔎 BULK DETECTION
  // ==================================================

  async detectMany(
    workflows: AbandonmentDetectionInput[],
  ): Promise<AbandonmentDetectionResult[]> {
    return Promise.all(
      workflows.map((workflow) =>
        this.detect(workflow),
      ),
    );
  }

  // ==================================================
  // 🧠 WORKFLOW TIMEOUT RESOLUTION
  // ==================================================

  getWorkflowTimeout(
    workflowType:
      | 'conversation'
      | 'session'
      | 'checkout'
      | 'payment'
      | 'order',
  ): number {
    return this.DEFAULT_TIMEOUTS[workflowType];
  }

  // ==================================================
  // 🏗️ ANOMALY FACTORY
  // ==================================================

  private buildAbandonmentAnomaly(
    input: AbandonmentDetectionInput,
    inactiveDurationMs: number,
  ): WorkflowAnomalyEntity {
    return new WorkflowAnomalyEntity({
      tenantId: input.tenantId,
      userId: input.userId,

      type:
        WorkflowAnomalyType.ABANDONED_WORKFLOW,

      reason: `Workflow inactive for ${inactiveDurationMs}ms`,

      metadata: {
        workflowType: input.workflowType,
        currentState: input.currentState,
        lastActivityAt: input.lastActivityAt,
        inactiveDurationMs,
      },

      detectedAt: new Date(),
    });
  }

  // ==================================================
  // 🚨 PROTECTION LEVEL RESOLUTION
  // ==================================================

  private resolveProtectionLevel(
    workflowType:
      | 'conversation'
      | 'session'
      | 'checkout'
      | 'payment'
      | 'order',
  ): ProtectionLevel {
    switch (workflowType) {
      case 'payment':
        return ProtectionLevel.CRITICAL;

      case 'checkout':
        return ProtectionLevel.WARNING;

      case 'order':
        return ProtectionLevel.WARNING;

      default:
        return ProtectionLevel.INFO;
    }
  }
}