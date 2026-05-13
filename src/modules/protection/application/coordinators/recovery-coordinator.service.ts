// FILE: src/modules/protection/application/coordinators/recovery-coordinator.service.ts

import { Injectable } from '@nestjs/common';

import { RecoveryReason } from '../../domain/enums/recovery-reason.enum';
import { WorkflowStatus } from '../../domain/enums/workflow-status.enum';
import { WorkflowAnomalyType } from '../../domain/enums/workflow-anomaly-type.enum';
import { ProtectionLevel } from '../../domain/enums/protection-level.enum';

import { RecoverySessionEntity } from '../../domain/entities/recovery-session.entity';

import { RecoveryStateRestorerService } from '../services/recovery-state-restorer.service';
import { WorkflowRepairService } from '../services/workflow-repair.service';
import { StaleWorkflowDetectorService } from '../services/stale-workflow-detector.service';
import { AbandonmentDetectionService } from '../services/abandonment-detection.service';
import { WorkflowTimelineService } from '../services/workflow-timeline.service';

import { WorkflowCacheRedisRepository } from '../../infrastructure/redis/workflow-cache.redis.repository';
import { RecoveryRedisRepository } from '../../infrastructure/redis/recovery.redis.repository';

import { RecoveryTracerService } from '../../infrastructure/observability/recovery-tracer.service';
import { WorkflowMetricsService } from '../../infrastructure/observability/workflow-metrics.service';
import { ProtectionLoggerService } from '../../infrastructure/observability/protection-logger.service';

/**
 * RecoveryCoordinatorService
 * ---------------------------------------------------------
 * MASTER RECOVERY AUTHORITY.
 *
 * Responsibilities:
 * - orchestrates ALL workflow recovery flows
 * - decides recovery strategy
 * - coordinates repair + restoration
 * - prevents conflicting recoveries
 * - centralizes recovery observability
 * - standardizes recovery execution
 *
 * IMPORTANT:
 * This is the SINGLE ENTRY POINT
 * for recovery execution across the platform.
 */

export interface RecoveryExecutionInput {
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

  recoveryReason: RecoveryReason;

  metadata?: Record<string, any>;
}

export interface RecoveryExecutionResult {
  success: boolean;

  workflowStatus: WorkflowStatus;

  protectionLevel: ProtectionLevel;

  repaired: boolean;

  restored: boolean;

  recoverySessionId: string;

  recoveryReason: RecoveryReason;

  finalState: string;

  executedAt: Date;
}

@Injectable()
export class RecoveryCoordinatorService {
  constructor(
    private readonly recoveryRestorer: RecoveryStateRestorerService,

    private readonly workflowRepair: WorkflowRepairService,

    private readonly staleWorkflowDetector: StaleWorkflowDetectorService,

    private readonly abandonmentDetector: AbandonmentDetectionService,

    private readonly timelineService: WorkflowTimelineService,

    private readonly workflowCache: WorkflowCacheRedisRepository,

    private readonly recoveryRepository: RecoveryRedisRepository,

    private readonly recoveryTracer: RecoveryTracerService,

    private readonly metricsService: WorkflowMetricsService,

    private readonly logger: ProtectionLoggerService,
  ) {}

  // ==================================================
  // 🚑 MAIN RECOVERY ENTRY
  // ==================================================

  async executeRecovery(
    input: RecoveryExecutionInput,
  ): Promise<RecoveryExecutionResult> {
    const startedAt = new Date();

    const recoverySession =
      RecoverySessionEntity.create({
        tenantId: input.tenantId,
        userId: input.userId,
        workflowId: input.workflowId,
        workflowType: input.workflowType,
        recoveryReason: input.recoveryReason,
      });

    // ==================================================
    // 🛰️ TRACE START
    // ==================================================

    await this.recoveryTracer.startTrace({
      recoverySessionId:
        recoverySession.id,
      workflowType: input.workflowType,
      recoveryReason:
        input.recoveryReason,
    });

    // ==================================================
    // 💾 STORE RECOVERY SESSION
    // ==================================================

    await this.recoveryRepository.storeRecoverySession(
      recoverySession,
    );

    // ==================================================
    // 📝 TIMELINE EVENT
    // ==================================================

    await this.timelineService.recordEvent({
      tenantId: input.tenantId,
      userId: input.userId,
      workflowType: input.workflowType,
      event: 'RECOVERY_TRIGGERED',
      state: input.currentState,
      metadata: {
        workflowId: input.workflowId,
        recoveryReason:
          input.recoveryReason,
        recoverySessionId:
          recoverySession.id,
      },
    });

    // ==================================================
    // 🔍 STALE DETECTION
    // ==================================================

    const staleResult =
      await this.staleWorkflowDetector.detect({
        tenantId: input.tenantId,
        userId: input.userId,
        workflowId: input.workflowId,
        workflowType: input.workflowType,
        currentState: input.currentState,
        lastTransitionAt:
          startedAt,
      });

    // ==================================================
    // 🔧 AUTO REPAIR
    // ==================================================

    let repaired = false;

    if (staleResult.stale) {
      await this.workflowRepair.repair({
        tenantId: input.tenantId,
        userId: input.userId,
        workflowId: input.workflowId,
        workflowType: input.workflowType,
        currentState: input.currentState,
        anomalyType:
          WorkflowAnomalyType.STALE_WORKFLOW,
      });

      repaired = true;
    }

    // ==================================================
    // ♻️ STATE RESTORATION
    // ==================================================

    const restoredState =
      this.resolveRestorationState(
        input.workflowType,
      );

    await this.recoveryRestorer.restore({
      tenantId: input.tenantId,
      userId: input.userId,
      workflowType: input.workflowType,
      currentState: input.currentState,
      targetState: restoredState,
      metadata: {
        recoveryReason:
          input.recoveryReason,
        repaired,
      },
    });

    // ==================================================
    // 💾 UPDATE CACHE
    // ==================================================

    await this.workflowCache.setWorkflowState({
      tenantId: input.tenantId,
      userId: input.userId,
      workflowType: input.workflowType,
      state: restoredState,
      metadata: {
        recovered: true,
        recoveryReason:
          input.recoveryReason,
        recoverySessionId:
          recoverySession.id,
      },
    });

    // ==================================================
    // 📊 METRICS
    // ==================================================

    await this.metricsService.recordRecoveryExecution(
      {
        workflowType: input.workflowType,
        recoveryReason:
          input.recoveryReason,
        repaired,
      },
    );

    // ==================================================
    // 🛰️ TRACE COMPLETE
    // ==================================================

    await this.recoveryTracer.completeTrace({
      recoverySessionId:
        recoverySession.id,
      successful: true,
    });

    // ==================================================
    // 📝 LOGGING
    // ==================================================

    this.logger.log(
      'RecoveryCoordinatorService',
      'WORKFLOW_RECOVERED',
      {
        tenantId: input.tenantId,
        userId: input.userId,
        metadata: {
          workflowType:
            input.workflowType,
          workflowId:
            input.workflowId,
          recoveryReason:
            input.recoveryReason,
          repaired,
          restoredState,
        },
      },
    );

    return {
      success: true,
      workflowStatus:
        WorkflowStatus.RECOVERED,
      protectionLevel:
        ProtectionLevel.WARNING,
      repaired,
      restored: true,
      recoverySessionId:
        recoverySession.id,
      recoveryReason:
        input.recoveryReason,
      finalState: restoredState,
      executedAt: new Date(),
    };
  }

  // ==================================================
  // ♻️ RESTORATION STATE RESOLUTION
  // ==================================================

  private resolveRestorationState(
    workflowType:
      | 'conversation'
      | 'session'
      | 'checkout'
      | 'payment'
      | 'order',
  ): string {
    switch (workflowType) {
      case 'conversation':
        return 'AWAITING_USER_INPUT';

      case 'session':
        return 'ACTIVE';

      case 'checkout':
        return 'CHECKOUT_RESTORED';

      case 'payment':
        return 'PAYMENT_PENDING_RETRY';

      case 'order':
        return 'ORDER_RESTORED';

      default:
        return 'RECOVERED';
    }
  }
}