// FILE: src/modules/protection/application/services/workflow-repair.service.ts

import { Injectable } from '@nestjs/common';

import { WorkflowStatus } from '../../domain/enums/workflow-status.enum';
import { WorkflowAnomalyType } from '../../domain/enums/workflow-anomaly-type.enum';
import { ProtectionLevel } from '../../domain/enums/protection-level.enum';

import { WorkflowAnomalyEntity } from '../../domain/entities/workflow-anomaly.entity';

import { WorkflowTimelineService } from './workflow-timeline.service';
import { RecoveryStateRestorerService } from './recovery-state-restorer.service';

import { WorkflowCacheRedisRepository } from '../../infrastructure/redis/workflow-cache.redis.repository';

import { ProtectionLoggerService } from '../../infrastructure/observability/protection-logger.service';
import { WorkflowMetricsService } from '../../infrastructure/observability/workflow-metrics.service';

/**
 * WorkflowRepairService
 * ---------------------------------------------------------
 * Automatically repairs broken workflow states.
 *
 * Responsibilities:
 * - repair stale workflows
 * - rollback corrupted states
 * - restore missing workflow transitions
 * - normalize invalid workflow states
 * - recover interrupted executions
 * - repair inconsistent workflow chains
 *
 * IMPORTANT:
 * This service performs AUTO-REPAIR.
 * Detection happens elsewhere.
 */

export interface WorkflowRepairInput {
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

  targetState?: string;

  anomalyType: WorkflowAnomalyType;

  metadata?: Record<string, any>;
}

export interface WorkflowRepairResult {
  repaired: boolean;

  previousState: string;

  repairedState: string;

  restoredState: string;

  workflowStatus: WorkflowStatus;

  protectionLevel: ProtectionLevel;

  repairAction: string;

  repairedAt: Date;

  anomaly?: WorkflowAnomalyEntity;
}

@Injectable()
export class WorkflowRepairService {
  constructor(
    private readonly workflowCache: WorkflowCacheRedisRepository,

    private readonly timelineService: WorkflowTimelineService,

    private readonly recoveryRestorer: RecoveryStateRestorerService,

    private readonly metricsService: WorkflowMetricsService,

    private readonly logger: ProtectionLoggerService,
  ) {}

  // ==================================================
  // 🔧 MAIN REPAIR ENTRY
  // ==================================================

  async repair(
    input: WorkflowRepairInput,
  ): Promise<WorkflowRepairResult> {
    const repairedState =
      this.resolveRepairState(input);

    const repairAction =
      this.resolveRepairAction(input);

    // ==================================================
    // ♻️ RESTORE VALID STATE
    // ==================================================

    await this.recoveryRestorer.restore({
      tenantId: input.tenantId,
      userId: input.userId,
      workflowType: input.workflowType,
      currentState: input.currentState,
      metadata: {
        workflowId: input.workflowId,
        anomalyType: input.anomalyType,
      },
      recoveryReason: 'REPAIR' as any,
    });

    // ==================================================
    // 💾 UPDATE WORKFLOW CACHE
    // ==================================================

    await this.workflowCache.setWorkflowState(
      `${input.tenantId}:${input.userId}:${input.workflowType}`,
      {
        traceId: Date.now().toString(),
        tenantId: input.tenantId,
        userId: input.userId,
        type: 'SESSION',
        state: repairedState,
        payload: {
        repaired: true,
        repairAction,
        repairedAt: new Date(),
      },
    });

    // ==================================================
    // 📝 RECORD REPAIR TIMELINE
    // ==================================================

    await this.timelineService.recordEvent({
      tenantId: input.tenantId,
      userId: input.userId,
      workflowType: input.workflowType,
      event: 'WORKFLOW_REPAIRED',
      state: repairedState,
      metadata: {
        workflowId: input.workflowId,
        previousState: input.currentState,
        repairedState,
        repairAction,
        anomalyType: input.anomalyType,
      },
    });

    // ==================================================
    // 📊 METRICS
    // ==================================================

    await this.metricsService.recordWorkflowRepair({
      workflowType: input.workflowType,
      anomalyType: input.anomalyType,
      repairedState,
    });

    // ==================================================
    // 📝 OBSERVABILITY
    // ==================================================

    this.logger.warn(
      'WorkflowRepairService',
      'WORKFLOW_REPAIRED',
      {
        tenantId: input.tenantId,
        userId: input.userId,
        metadata: {
          workflowType: input.workflowType,
          workflowId: input.workflowId,
          previousState: input.currentState,
          repairedState,
          repairAction,
          anomalyType: input.anomalyType,
        },
      },
    );

    return {
      repaired: true,
      previousState: input.currentState,
      repairedState,
      restoredState: repairedState,
      workflowStatus: WorkflowStatus.REPAIRED,
      protectionLevel:
        ProtectionLevel.WARNING,
      repairAction,
      repairedAt: new Date(),
      anomaly: this.buildRepairAnomaly(input),
    };
  }

  // ==================================================
  // 🧠 REPAIR STATE RESOLUTION
  // ==================================================

  private resolveRepairState(
    input: WorkflowRepairInput,
  ): string {
    // explicit target state wins
    if (input.targetState) {
      return input.targetState;
    }

    switch (input.workflowType) {
      case 'conversation':
        return 'AWAITING_USER_INPUT';

      case 'session':
        return 'ACTIVE';

      case 'checkout':
        return 'CART_RESTORED';

      case 'payment':
        return 'PAYMENT_PENDING_RETRY';

      case 'order':
        return 'ORDER_PENDING_VALIDATION';

      default:
        return 'RECOVERED';
    }
  }

  // ==================================================
  // 🔧 REPAIR ACTION RESOLUTION
  // ==================================================

  private resolveRepairAction(
    input: WorkflowRepairInput,
  ): string {
    switch (input.anomalyType) {
      case WorkflowAnomalyType.STALE_WORKFLOW:
        return 'RESET_STALE_WORKFLOW';

      case WorkflowAnomalyType.INVALID_TRANSITION:
        return 'ROLLBACK_INVALID_TRANSITION';

      case WorkflowAnomalyType.DUPLICATE_PROCESSING:
        return 'REMOVE_DUPLICATE_EXECUTION';

      case WorkflowAnomalyType.MISSING_DATA:
        return 'RESTORE_MISSING_STATE';

      case WorkflowAnomalyType.CROSS_TENANT_ACCESS:
        return 'ISOLATE_TENANT_CONTEXT';

      default:
        return 'GENERAL_WORKFLOW_REPAIR';
    }
  }

  // ==================================================
  // 🚨 REPAIR ANOMALY FACTORY
  // ==================================================

  private buildRepairAnomaly(
    input: WorkflowRepairInput,
  ): WorkflowAnomalyEntity {
    return new WorkflowAnomalyEntity({
      tenantId: input.tenantId,
      userId: input.userId,

      type: input.anomalyType,

      reason: `Workflow repaired from ${input.currentState}`,

      metadata: {
        workflowType: input.workflowType,
        workflowId: input.workflowId,
        previousState: input.currentState,
      },

      detectedAt: new Date(),
    });
  }
}