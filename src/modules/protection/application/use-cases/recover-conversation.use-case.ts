// FILE: src/modules/protection/application/use-cases/recover-conversation.use-case.ts

import { Injectable } from '@nestjs/common';

import { RecoveryReason } from '../../domain/enums/recovery-reason.enum';

import { ConversationRecoveryStrategy } from '../strategies/conversation-recovery.strategy';

import { WorkflowTimelineService } from '../services/workflow-timeline.service';
import { RecoveryCoordinatorService } from '../coordinators/recovery-coordinator.service';

import { ProtectionLoggerService } from '../../infrastructure/observability/protection-logger.service';

/**
 * RecoverConversationUseCase
 * ---------------------------------------------------------
 * Entry use-case for executing conversation recovery.
 *
 * This is the APPLICATION ENTRY POINT that:
 * - triggers recovery orchestration
 * - delegates to coordinator OR direct strategy
 * - ensures consistent execution boundary
 *
 * IMPORTANT:
 * In real architecture, this is what controllers call.
 */

export interface RecoverConversationInput {
  tenantId: string;
  userId: string;

  conversationId?: string;

  currentState: string;

  recoveryReason: RecoveryReason;

  lastKnownIntent?: string;

  lastMessageId?: string;

  metadata?: Record<string, any>;
}

export interface RecoverConversationOutput {
  success: boolean;

  restoredState: string;

  recoveredAt: Date;

  resumedFromCheckpoint: boolean;
}

@Injectable()
export class RecoverConversationUseCase {
  constructor(
    private readonly conversationRecovery: ConversationRecoveryStrategy,

    private readonly recoveryCoordinator: RecoveryCoordinatorService,

    private readonly timeline: WorkflowTimelineService,

    private readonly logger: ProtectionLoggerService,
  ) {}

  // ==================================================
  // 🚀 EXECUTE USE CASE
  // ==================================================

  async execute(
    input: RecoverConversationInput,
  ): Promise<RecoverConversationOutput> {
    // ==================================================
    // 🧭 DECISION: DIRECT STRATEGY VS COORDINATOR
    // ==================================================

    const useCoordinator =
      this.shouldUseCoordinator(input);

    // ==================================================
    // ♻️ EXECUTION PATH 1: COORDINATED RECOVERY
    // ==================================================

    if (useCoordinator) {
      const result =
        await this.recoveryCoordinator.executeRecovery({
          tenantId: input.tenantId,
          userId: input.userId,
          workflowType: 'conversation',
          currentState: input.currentState,
          recoveryReason: input.recoveryReason,
          workflowId: input.conversationId,
        });

      return {
        success: result.success,
        restoredState: result.finalState,
        recoveredAt: result.executedAt,
        resumedFromCheckpoint: true,
      };
    }

    // ==================================================
    // ♻️ EXECUTION PATH 2: DIRECT STRATEGY RECOVERY
    // ==================================================

    const result =
      await this.conversationRecovery.recover({
        tenantId: input.tenantId,
        userId: input.userId,
        conversationId: input.conversationId,
        currentState: input.currentState,
        recoveryReason: input.recoveryReason,
        lastKnownIntent: input.lastKnownIntent,
        lastMessageId: input.lastMessageId,
      });

    // ==================================================
    // 📝 TIMELINE
    // ==================================================

    await this.timeline.recordEvent({
      tenantId: input.tenantId,
      userId: input.userId,
      workflowType: 'conversation',
      event: 'CONVERSATION_RECOVERY_EXECUTED',
      state: result.restoredState,
      metadata: {
        recoveryReason: input.recoveryReason,
        resumedFromCheckpoint: result.resumedFromCheckpoint,
      },
    });

    // ==================================================
    // 🧾 LOGGING
    // ==================================================

    this.logger.log(
      'RecoverConversationUseCase',
      'EXECUTED',
      {
        tenantId: input.tenantId,
        userId: input.userId,
        metadata: {
          conversationId: input.conversationId,
          restoredState: result.restoredState,
          recoveryReason: input.recoveryReason,
        },
      },
    );

    return {
      success: result.recovered,
      restoredState: result.restoredState,
      recoveredAt: result.recoveredAt,
      resumedFromCheckpoint: result.resumedFromCheckpoint,
    };
  }

  // ==================================================
  // 🧠 ROUTING LOGIC
  // ==================================================

  private shouldUseCoordinator(
    input: RecoverConversationInput,
  ): boolean {
    // Coordinator is used for complex or high-risk recovery flows
    if (input.recoveryReason === RecoveryReason.PAYMENT_FAILED)
      return true;

    if (input.recoveryReason === RecoveryReason.TIMEOUT)
      return true;

    if (!input.conversationId) return true;

    return false;
  }
}