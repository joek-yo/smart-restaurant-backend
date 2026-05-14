// FILE: src/modules/protection/application/services/stale-workflow-detector.service.ts

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
 * StaleWorkflowDetectorService
 * --------------------------------------------------------
 * Detects workflows that are STUCK or FROZEN.
 *
 * DIFFERENCE FROM ABANDONMENT:
 * - abandonment = user inactivity
 * - stale workflow = system workflow freeze/corruption
 *
 * Examples:
 * - payment stuck in PROCESSING
 * - checkout never completed
 * - lock never released
 * - conversation frozen mid-transition
 * - workflow waiting forever
 */

export interface StaleWorkflowDetectionInput {
  tenantId: string;
  userId: string;

  workflowId?: string;

  workflowType:
    | 'conversation'
    | 'session'
    | 'checkout'
    | 'payment'
    | 'order';

  currentState: string;

  lastTransitionAt: Date;

  maxStateDurationMs?: number;

  metadata?: Record<string, any>;
}

export interface StaleWorkflowDetectionResult {
  stale: boolean;

  workflowStatus: WorkflowStatus;

  staleDurationMs: number;

  allowedDurationMs: number;

  anomaly?: WorkflowAnomalyEntity;

  protectionLevel?: ProtectionLevel;

  recommendedRepairAction?: string;
}

@Injectable()
export class StaleWorkflowDetectorService {
  // ==================================================
  // ⏱️ MAX STATE DURATIONS
  // ==================================================

  private readonly MAX_DURATIONS = {
    conversation: 1000 * 60 * 20, // 20 min
    session: 1000 * 60 * 60, // 1h
    checkout: 1000 * 60 * 10, // 10 min
    payment: 1000 * 60 * 5, // 5 min
    order: 1000 * 60 * 30, // 30 min
  };

  constructor(
    private readonly workflowCache: WorkflowCacheRedisRepository,

    private readonly timelineService: WorkflowTimelineService,

    private readonly metricsService: WorkflowMetricsService,

    private readonly logger: ProtectionLoggerService,
  ) {}

  // ==================================================
  // 🚦 MAIN DETECTION ENTRY
  // ==================================================

  async detect(
    input: StaleWorkflowDetectionInput,
  ): Promise<StaleWorkflowDetectionResult> {
    const now = Date.now();

    const transitionAt =
      new Date(input.lastTransitionAt).getTime();

    const staleDurationMs =
      now - transitionAt;

    const allowedDurationMs =
      input.maxStateDurationMs ??
      this.MAX_DURATIONS[input.workflowType];

    // ==================================================
    // ✅ WORKFLOW HEALTHY
    // ==================================================

    if (staleDurationMs < allowedDurationMs) {
      return {
        stale: false,
        workflowStatus: WorkflowStatus.HEALTHY,
        staleDurationMs,
        allowedDurationMs,
      };
    }

    // ==================================================
    // 🚨 STALE WORKFLOW DETECTED
    // ==================================================

    const anomaly =
      this.buildStaleWorkflowAnomaly(
        input,
        staleDurationMs,
      );

    // ==================================================
    // 💾 CACHE STALE STATUS
    // ==================================================

    await this.workflowCache.setWorkflowState(
      `${input.tenantId}:${input.userId}:${input.workflowType}`,
      {
        traceId: Date.now().toString(),
        tenantId: input.tenantId,
        userId: input.userId,
        type: 'SESSION',
        state: 'STALE',
        payload: {
        workflowId: input.workflowId,
        staleDurationMs,
        detectedAt: new Date(),
      },
    });

    // ==================================================
    // 📝 TIMELINE EVENT
    // ==================================================

    await this.timelineService.recordEvent({
      tenantId: input.tenantId,
      userId: input.userId,
      workflowType: input.workflowType,
      event: 'STALE_WORKFLOW_DETECTED',
      state: input.currentState,
      metadata: {
        workflowId: input.workflowId,
        staleDurationMs,
        allowedDurationMs,
      },
    });

    // ==================================================
    // 📊 METRICS
    // ==================================================

    await this.metricsService.recordStaleWorkflow({
      workflowType: input.workflowType,
      state: input.currentState,
      staleDurationMs,
    });

    // ==================================================
    // 📝 OBSERVABILITY
    // ==================================================

    this.logger.warn(
      'StaleWorkflowDetectorService',
      'STALE_WORKFLOW_DETECTED',
      {
        tenantId: input.tenantId,
        userId: input.userId,
        metadata: {
          workflowType: input.workflowType,
          workflowId: input.workflowId,
          currentState: input.currentState,
          staleDurationMs,
        },
      },
    );

    return {
      stale: true,
      workflowStatus: WorkflowStatus.STALE,
      staleDurationMs,
      allowedDurationMs,
      anomaly,
      protectionLevel: this.resolveProtectionLevel(
        input.workflowType,
      ),
      recommendedRepairAction:
        this.resolveRepairAction(input),
    };
  }

  // ==================================================
  // 🔎 BULK DETECTION
  // ==================================================

  async detectMany(
    workflows: StaleWorkflowDetectionInput[],
  ): Promise<StaleWorkflowDetectionResult[]> {
    return Promise.all(
      workflows.map((workflow) =>
        this.detect(workflow),
      ),
    );
  }

  // ==================================================
  // 🏗️ ANOMALY FACTORY
  // ==================================================

  private buildStaleWorkflowAnomaly(
    input: StaleWorkflowDetectionInput,
    staleDurationMs: number,
  ): WorkflowAnomalyEntity {
    return new WorkflowAnomalyEntity({
      tenantId: input.tenantId,
      userId: input.userId,

      type:
        WorkflowAnomalyType.STALE_WORKFLOW,

      reason: `Workflow frozen in ${input.currentState} for ${staleDurationMs}ms`,

      metadata: {
        workflowType: input.workflowType,
        workflowId: input.workflowId,
        currentState: input.currentState,
        staleDurationMs,
        lastTransitionAt: input.lastTransitionAt,
      },

      detectedAt: new Date(),
    });
  }

  // ==================================================
  // 🔧 REPAIR RECOMMENDATIONS
  // ==================================================

  private resolveRepairAction(
    input: StaleWorkflowDetectionInput,
  ): string {
    switch (input.workflowType) {
      case 'payment':
        return 'RETRY_PAYMENT_OR_ROLLBACK';

      case 'checkout':
        return 'RESTORE_CHECKOUT_STATE';

      case 'conversation':
        return 'RESET_CONVERSATION_STATE';

      case 'session':
        return 'RESTORE_SESSION';

      case 'order':
        return 'REPAIR_ORDER_WORKFLOW';

      default:
        return 'MANUAL_REVIEW';
    }
  }

  // ==================================================
  // 🚨 PROTECTION LEVEL
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
        return ProtectionLevel.FATAL;

      case 'checkout':
        return ProtectionLevel.CRITICAL;

      case 'order':
        return ProtectionLevel.CRITICAL;

      case 'conversation':
        return ProtectionLevel.WARNING;

      default:
        return ProtectionLevel.WARNING;
    }
  }
}