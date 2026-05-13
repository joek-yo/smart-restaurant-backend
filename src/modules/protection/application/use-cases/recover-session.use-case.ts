// FILE: src/modules/protection/application/use-cases/recover-session.use-case.ts

import { Injectable } from '@nestjs/common';

import { RecoveryReason } from '../../domain/enums/recovery-reason.enum';

import { SessionRecoveryStrategy } from '../strategies/session-recovery.strategy';
import { RecoveryCoordinatorService } from '../coordinators/recovery-coordinator.service';

import { WorkflowTimelineService } from '../services/workflow-timeline.service';
import { ProtectionLoggerService } from '../../infrastructure/observability/protection-logger.service';

/**
 * RecoverSessionUseCase
 * ---------------------------------------------------------
 * Application entry point for SESSION recovery execution.
 *
 * Responsibilities:
 * - decides execution path (coordinator vs direct strategy)
 * - triggers session recovery flow
 * - ensures observability + audit trail
 *
 * Session recovery is focused on:
 * - restoring session continuity
 * - rehydrating session state
 * - recovering interrupted sessions
 */

export interface RecoverSessionInput {
  tenantId: string;
  userId: string;

  sessionId?: string;

  currentState: string;

  recoveryReason: RecoveryReason;

  sessionStartedAt?: Date;

  lastActivityAt?: Date;

  metadata?: Record<string, any>;
}

export interface RecoverSessionOutput {
  success: boolean;

  restoredState: string;

  recoveredAt: Date;

  sessionRehydrated: boolean;
}

@Injectable()
export class RecoverSessionUseCase {
  constructor(
    private readonly sessionRecovery: SessionRecoveryStrategy,

    private readonly recoveryCoordinator: RecoveryCoordinatorService,

    private readonly timeline: WorkflowTimelineService,

    private readonly logger: ProtectionLoggerService,
  ) {}

  // ==================================================
  // 🚀 EXECUTE SESSION RECOVERY
  // ==================================================

  async execute(
    input: RecoverSessionInput,
  ): Promise<RecoverSessionOutput> {
    const useCoordinator =
      this.shouldUseCoordinator(input);

    // ==================================================
    // 🧭 COORDINATED PATH
    // ==================================================

    if (useCoordinator) {
      const result =
        await this.recoveryCoordinator.executeRecovery({
          tenantId: input.tenantId,
          userId: input.userId,
          workflowType: 'session',
          currentState: input.currentState,
          recoveryReason: input.recoveryReason,
          workflowId: input.sessionId,
        });

      return {
        success: result.success,
        restoredState: result.finalState,
        recoveredAt: result.executedAt,
        sessionRehydrated: true,
      };
    }

    // ==================================================
    // ♻️ DIRECT STRATEGY PATH
    // ==================================================

    const result =
      await this.sessionRecovery.recover({
        tenantId: input.tenantId,
        userId: input.userId,
        sessionId: input.sessionId,
        currentState: input.currentState,
        recoveryReason: input.recoveryReason,
        sessionStartedAt: input.sessionStartedAt,
        lastActivityAt: input.lastActivityAt,
      });

    // ==================================================
    // 📝 TIMELINE
    // ==================================================

    await this.timeline.recordEvent({
      tenantId: input.tenantId,
      userId: input.userId,
      workflowType: 'session',
      event: 'SESSION_RECOVERY_EXECUTED',
      state: result.restoredState,
      metadata: {
        sessionId: input.sessionId,
        recoveryReason: input.recoveryReason,
        sessionRehydrated: result.sessionRehydrated,
      },
    });

    // ==================================================
    // 🧾 LOGGING
    // ==================================================

    this.logger.log(
      'RecoverSessionUseCase',
      'EXECUTED',
      {
        tenantId: input.tenantId,
        userId: input.userId,
        metadata: {
          sessionId: input.sessionId,
          restoredState: result.restoredState,
          recoveryReason: input.recoveryReason,
        },
      },
    );

    return {
      success: result.recovered,
      restoredState: result.restoredState,
      recoveredAt: result.recoveredAt,
      sessionRehydrated: result.sessionRehydrated,
    };
  }

  // ==================================================
  // 🧠 ROUTING DECISION
  // ==================================================

  private shouldUseCoordinator(
    input: RecoverSessionInput,
  ): boolean {
    // Complex or risky flows go through coordinator

    if (input.recoveryReason === RecoveryReason.TIMEOUT)
      return true;

    if (input.recoveryReason === RecoveryReason.RECONNECT)
      return false;

    if (!input.sessionId) return true;

    return false;
  }
}