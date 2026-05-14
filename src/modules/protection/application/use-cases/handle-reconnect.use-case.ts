// FILE: src/modules/protection/application/use-cases/handle-reconnect.use-case.ts

import { Injectable } from '@nestjs/common';

import { RecoveryReason } from '../../domain/enums/recovery-reason.enum';

import { ReconnectRecoveryStrategy } from '../strategies/reconnect-recovery.strategy';
import { RecoveryCoordinatorService } from '../coordinators/recovery-coordinator.service';

import { WorkflowTimelineService } from '../services/workflow-timeline.service';
import { ProtectionLoggerService } from '../../infrastructure/observability/protection-logger.service';

/**
 * HandleReconnectUseCase
 * ---------------------------------------------------------
 * Entry point for handling reconnect events across workflows.
 *
 * Responsibilities:
 * - restore workflow continuity after network/session reconnect
 * - decide between safe direct recovery vs coordinated recovery
 * - ensure no duplicate execution on re-entry
 * - maintain state consistency across reconnect spikes
 *
 * Reconnect ≠ failure:
 * It is a temporary disconnection recovery event.
 */

export interface HandleReconnectInput {
  tenantId: string;
  userId: string;

  workflowType: 'conversation' | 'session' | 'checkout' | 'payment' | 'order';

  currentState: string;

  lastKnownState?: string;

  workflowId?: string;

  metadata?: Record<string, any>;
}

export interface HandleReconnectOutput {
  success: boolean;

  recovered: boolean;

  restoredState: string;

  handledAt: Date;

  resumed: boolean;

  usedStrategy: 'direct' | 'coordinator';
}

@Injectable()
export class HandleReconnectUseCase {
  constructor(
    private readonly reconnectStrategy: ReconnectRecoveryStrategy,
    private readonly recoveryCoordinator: RecoveryCoordinatorService,
    private readonly timeline: WorkflowTimelineService,
    private readonly logger: ProtectionLoggerService,
  ) {}

  // ==================================================
  // 🚀 EXECUTE RECONNECT HANDLING
  // ==================================================

  async execute(
    input: HandleReconnectInput,
  ): Promise<HandleReconnectOutput> {
    const strategy = this.selectStrategy(input);

    // ==================================================
    // 🧭 COORDINATOR PATH (COMPLEX / RISKY RECONNECTS)
    // ==================================================

    if (strategy === 'coordinator') {
      const result =
        await this.recoveryCoordinator.executeRecovery({
          tenantId: input.tenantId,
          userId: input.userId,
          workflowType: input.workflowType,
          currentState: input.currentState,
          recoveryReason: RecoveryReason.RECONNECT,
          workflowId: input.workflowId,
        });

      return {
        success: result.success,
        recovered: result.success,
        restoredState: result.finalState,
        handledAt: result.executedAt,
        resumed: true,
        usedStrategy: 'coordinator',
      };
    }

    // ==================================================
    // ♻️ DIRECT RECONNECT RECOVERY PATH
    // ==================================================

    const result =
      await this.reconnectStrategy.recover({
        tenantId: input.tenantId,
        userId: input.userId,
        workflowType: input.workflowType,
        currentState: input.currentState,
        lastKnownState: input.lastKnownState,
        recoveryReason: RecoveryReason.RECONNECT,
      });

    // ==================================================
    // 📝 TIMELINE EVENT
    // ==================================================

    await this.timeline.recordEvent({
      tenantId: input.tenantId,
      userId: input.userId,
      workflowType: input.workflowType,
      event: 'RECONNECT_HANDLED',
      state: result.restoredState,
      metadata: {
        workflowId: input.workflowId,
        resumed: result.resumed,
      },
    });

    // ==================================================
    // 🧾 LOGGING
    // ==================================================

    this.logger.log('info', 'HandleReconnectUseCase',
      'EXECUTED',
      {
        tenantId: input.tenantId,
        userId: input.userId,
        metadata: {
          workflowType: input.workflowType,
          workflowId: input.workflowId,
          restoredState: result.restoredState,
        },
      },
    );

    return {
      success: result.recovered,
      recovered: result.recovered,
      restoredState: result.restoredState,
      handledAt: result.recoveredAt,
      resumed: result.resumed,
      usedStrategy: 'direct',
    };
  }

  // ==================================================
  // 🧠 STRATEGY ROUTING
  // ==================================================

  private selectStrategy(
    input: HandleReconnectInput,
  ): 'direct' | 'coordinator' {
    // missing context = risk escalation
    if (!input.workflowId) return 'coordinator';

    // checkout/payment always go safe route via coordinator
    if (
      input.workflowType === 'payment' ||
      input.workflowType === 'checkout'
    ) {
      return 'coordinator';
    }

    // no last known state = unsafe direct recovery
    if (!input.lastKnownState) return 'coordinator';

    return 'direct';
  }
}