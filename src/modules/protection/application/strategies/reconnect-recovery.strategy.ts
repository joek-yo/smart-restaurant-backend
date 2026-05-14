// FILE: src/modules/protection/application/strategies/reconnect-recovery.strategy.ts

import { Injectable } from '@nestjs/common';

import { RecoveryReason } from '../../domain/enums/recovery-reason.enum';
import { WorkflowStatus } from '../../domain/enums/workflow-status.enum';
import { ProtectionLevel } from '../../domain/enums/protection-level.enum';

import { RecoveryStateRestorerService } from '../services/recovery-state-restorer.service';
import { WorkflowTimelineService } from '../services/workflow-timeline.service';

import { WorkflowCacheRedisRepository } from '../../infrastructure/redis/workflow-cache.redis.repository';

import { RecoveryTracerService } from '../../infrastructure/observability/recovery-tracer.service';
import { ProtectionLoggerService } from '../../infrastructure/observability/protection-logger.service';

/**
 * ReconnectRecoveryStrategy
 * ---------------------------------------------------------
 * Recovery strategy for reconnect events.
 *
 * Responsibilities:
 * - resume workflows after network/client reconnect
 * - rehydrate last known state safely
 * - avoid duplicate continuation execution
 * - restore session continuity across transient disconnects
 *
 * IMPORTANT:
 * Reconnect recovery assumes state is still valid,
 * but temporarily inaccessible or paused.
 */

export interface ReconnectRecoveryInput {
  tenantId: string;
  userId: string;

  workflowType:
    | 'conversation'
    | 'session'
    | 'checkout'
    | 'payment'
    | 'order';

  currentState: string;

  lastKnownState?: string;

  recoveryReason: RecoveryReason;

  metadata?: Record<string, any>;
}

export interface ReconnectRecoveryResult {
  recovered: boolean;

  previousState: string;

  restoredState: string;

  workflowStatus: WorkflowStatus;

  protectionLevel: ProtectionLevel;

  resumed: boolean;

  recoveryReason: RecoveryReason;

  recoveredAt: Date;
}

@Injectable()
export class ReconnectRecoveryStrategy {
  constructor(
    private readonly workflowCache: WorkflowCacheRedisRepository,

    private readonly stateRestorer: RecoveryStateRestorerService,

    private readonly timelineService: WorkflowTimelineService,

    private readonly recoveryTracer: RecoveryTracerService,

    private readonly logger: ProtectionLoggerService,
  ) {}

  // ==================================================
  // ♻️ MAIN RECOVERY ENTRY
  // ==================================================

  async recover(
    input: ReconnectRecoveryInput,
  ): Promise<ReconnectRecoveryResult> {
    const restoredState =
      this.resolveReconnectState(input);

    const resumed = !!input.lastKnownState;

    // ==================================================
    // 🛰️ TRACE RECOVERY
    // ==================================================

    await this.recoveryTracer.addSpan({
      workflowType: input.workflowType,
      operation: 'reconnect_recovery',
      metadata: {
        recoveryReason: input.recoveryReason,
        previousState: input.currentState,
        lastKnownState: input.lastKnownState,
        restoredState,
      },
    });

    // ==================================================
    // ♻️ RESTORE STATE
    // ==================================================

    await this.stateRestorer.restore({
      tenantId: input.tenantId,
      userId: input.userId,
      workflowType: input.workflowType,
      currentState: input.currentState,
      recoveryReason: input.recoveryReason,
      metadata: {
        recoveryReason: input.recoveryReason,
        resumed,
        lastKnownState: input.lastKnownState,
      },
    });

    // ==================================================
    // 💾 CACHE UPDATE
    // ==================================================

    await this.workflowCache.setWorkflowState(
      `${input.tenantId}:${input.userId}:${input.workflowType}`,
      {
        traceId: Date.now().toString(),
        tenantId: input.tenantId,
        userId: input.userId,
        type: 'SESSION',
        state: restoredState,
        payload: {
        recovered: true,
        resumed,
        lastKnownState: input.lastKnownState,
      },
    });

    // ==================================================
    // 📝 TIMELINE EVENT
    // ==================================================

    await this.timelineService.recordEvent({
      tenantId: input.tenantId,
      userId: input.userId,
      workflowType: input.workflowType,
      event: 'RECONNECT_RECOVERY',
      state: restoredState,
      metadata: {
        previousState: input.currentState,
        restoredState,
        recoveryReason: input.recoveryReason,
        resumed,
      },
    });

    // ==================================================
    // 🧾 LOGGING
    // ==================================================

    this.logger.log('info', 'ReconnectRecoveryStrategy',
      'RECONNECT_RECOVERY_SUCCESS',
      {
        tenantId: input.tenantId,
        userId: input.userId,
        metadata: {
          workflowType: input.workflowType,
          restoredState,
          resumed,
        },
      },
    );

    return {
      recovered: true,
      previousState: input.currentState,
      restoredState,
      workflowStatus: WorkflowStatus.RECOVERED,
      protectionLevel: ProtectionLevel.INFO,
      resumed,
      recoveryReason: input.recoveryReason,
      recoveredAt: new Date(),
    };
  }

  // ==================================================
  // 🧠 RECONNECT STATE RESOLUTION
  // ==================================================

  private resolveReconnectState(
    input: ReconnectRecoveryInput,
  ): string {
    if (input.lastKnownState) {
      return input.lastKnownState;
    }

    switch (input.workflowType) {
      case 'conversation':
        return 'RESUMED_CONVERSATION';

      case 'session':
        return 'SESSION_RESUMED';

      case 'checkout':
        return 'CHECKOUT_RESUMED';

      case 'payment':
        return 'PAYMENT_RESUMED';

      case 'order':
        return 'ORDER_RESUMED';

      default:
        return 'RESUMED';
    }
  }
}