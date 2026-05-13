// FILE: src/modules/protection/application/strategies/session-recovery.strategy.ts

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
 * SessionRecoveryStrategy
 * ---------------------------------------------------------
 * Recovery strategy specialized for session workflows.
 *
 * Responsibilities:
 * - restore interrupted sessions
 * - recover expired temporary session state
 * - rehydrate session metadata
 * - restore authentication/session continuity
 * - recover session checkpoints
 * - restore interaction progress
 *
 * IMPORTANT:
 * Session recovery focuses ONLY on session continuity.
 */

export interface SessionRecoveryInput {
  tenantId: string;
  userId: string;

  sessionId?: string;

  currentState: string;

  recoveryReason: RecoveryReason;

  sessionStartedAt?: Date;

  lastActivityAt?: Date;

  metadata?: Record<string, any>;
}

export interface SessionRecoveryResult {
  recovered: boolean;

  previousState: string;

  restoredState: string;

  workflowStatus: WorkflowStatus;

  protectionLevel: ProtectionLevel;

  sessionRehydrated: boolean;

  recoveryReason: RecoveryReason;

  recoveredAt: Date;
}

@Injectable()
export class SessionRecoveryStrategy {
  constructor(
    private readonly workflowCache: WorkflowCacheRedisRepository,

    private readonly stateRestorer: RecoveryStateRestorerService,

    private readonly timelineService: WorkflowTimelineService,

    private readonly recoveryTracer: RecoveryTracerService,

    private readonly logger: ProtectionLoggerService,
  ) {}

  // ==================================================
  // ♻️ MAIN RECOVERY EXECUTION
  // ==================================================

  async recover(
    input: SessionRecoveryInput,
  ): Promise<SessionRecoveryResult> {
    const restoredState =
      this.resolveSessionState(input);

    const sessionRehydrated =
      this.canRehydrateSession(input);

    // ==================================================
    // 🛰️ TRACE RECOVERY
    // ==================================================

    await this.recoveryTracer.addSpan({
      workflowType: 'session',
      operation: 'session_recovery',
      metadata: {
        sessionId: input.sessionId,
        recoveryReason:
          input.recoveryReason,
        previousState:
          input.currentState,
        restoredState,
      },
    });

    // ==================================================
    // ♻️ RESTORE SESSION
    // ==================================================

    await this.stateRestorer.restore({
      tenantId: input.tenantId,
      userId: input.userId,
      workflowType: 'session',
      currentState: input.currentState,
      targetState: restoredState,
      metadata: {
        sessionId: input.sessionId,
        recoveryReason:
          input.recoveryReason,
        sessionRehydrated,
      },
    });

    // ==================================================
    // 💾 UPDATE CACHE
    // ==================================================

    await this.workflowCache.setWorkflowState({
      tenantId: input.tenantId,
      userId: input.userId,
      workflowType: 'session',
      state: restoredState,
      metadata: {
        sessionId: input.sessionId,
        recovered: true,
        sessionRehydrated,
      },
    });

    // ==================================================
    // 📝 RECORD TIMELINE
    // ==================================================

    await this.timelineService.recordEvent({
      tenantId: input.tenantId,
      userId: input.userId,
      workflowType: 'session',
      event: 'SESSION_RECOVERED',
      state: restoredState,
      metadata: {
        sessionId: input.sessionId,
        previousState:
          input.currentState,
        restoredState,
        recoveryReason:
          input.recoveryReason,
        sessionRehydrated,
      },
    });

    // ==================================================
    // 📝 OBSERVABILITY
    // ==================================================

    this.logger.log(
      'SessionRecoveryStrategy',
      'SESSION_RECOVERY_SUCCESS',
      {
        tenantId: input.tenantId,
        userId: input.userId,
        metadata: {
          sessionId: input.sessionId,
          previousState:
            input.currentState,
          restoredState,
          recoveryReason:
            input.recoveryReason,
        },
      },
    );

    return {
      recovered: true,
      previousState: input.currentState,
      restoredState,
      workflowStatus:
        WorkflowStatus.RECOVERED,
      protectionLevel:
        ProtectionLevel.WARNING,
      sessionRehydrated,
      recoveryReason:
        input.recoveryReason,
      recoveredAt: new Date(),
    };
  }

  // ==================================================
  // 🧠 RESTORE TARGET STATE
  // ==================================================

  private resolveSessionState(
    input: SessionRecoveryInput,
  ): string {
    switch (input.recoveryReason) {
      case RecoveryReason.RECONNECT:
        return 'SESSION_RESUMED';

      case RecoveryReason.TIMEOUT:
        return 'SESSION_RESTORED';

      case RecoveryReason.ABANDONED:
        return 'SESSION_REACTIVATED';

      case RecoveryReason.DUPLICATE_MESSAGE:
        return 'SESSION_CONTINUED';

      default:
        return 'ACTIVE';
    }
  }

  // ==================================================
  // 🔄 SESSION REHYDRATION
  // ==================================================

  private canRehydrateSession(
    input: SessionRecoveryInput,
  ): boolean {
    return !!(
      input.sessionStartedAt ||
      input.lastActivityAt
    );
  }
}