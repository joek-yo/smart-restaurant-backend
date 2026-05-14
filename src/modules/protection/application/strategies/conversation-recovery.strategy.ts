// FILE: src/modules/protection/application/strategies/conversation-recovery.strategy.ts

import { Injectable } from '@nestjs/common';

import { RecoveryReason } from '../../domain/enums/recovery-reason.enum';
import { WorkflowStatus } from '../../domain/enums/workflow-status.enum';
import { ProtectionLevel } from '../../domain/enums/protection-level.enum';

import { RecoveryStateRestorerService } from '../services/recovery-state-restorer.service';
import { WorkflowTimelineService } from '../services/workflow-timeline.service';

import { WorkflowCacheRedisRepository } from '../../infrastructure/redis/workflow-cache.redis.repository';

import { ProtectionLoggerService } from '../../infrastructure/observability/protection-logger.service';
import { RecoveryTracerService } from '../../infrastructure/observability/recovery-tracer.service';

/**
 * ConversationRecoveryStrategy
 * ---------------------------------------------------------
 * Recovery strategy specialized for conversation workflows.
 *
 * Responsibilities:
 * - restore broken conversation states
 * - recover interrupted user interactions
 * - restore AI conversation continuity
 * - recover menu/navigation progress
 * - repair reconnect interruptions
 * - restore pending prompts/context
 *
 * IMPORTANT:
 * Strategy ONLY defines conversation-specific recovery logic.
 * Coordination happens elsewhere.
 */

export interface ConversationRecoveryInput {
  tenantId: string;
  userId: string;

  conversationId?: string;

  currentState: string;

  recoveryReason: RecoveryReason;

  lastKnownIntent?: string;

  lastMessageId?: string;

  metadata?: Record<string, any>;
}

export interface ConversationRecoveryResult {
  recovered: boolean;

  previousState: string;

  restoredState: string;

  workflowStatus: WorkflowStatus;

  protectionLevel: ProtectionLevel;

  resumedFromCheckpoint: boolean;

  recoveryReason: RecoveryReason;

  recoveredAt: Date;
}

@Injectable()
export class ConversationRecoveryStrategy {
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
    input: ConversationRecoveryInput,
  ): Promise<ConversationRecoveryResult> {
    const restoredState =
      this.resolveConversationState(input);

    const resumedFromCheckpoint =
      this.canResumeFromCheckpoint(input);

    // ==================================================
    // 🛰️ TRACE RECOVERY
    // ==================================================

    await this.recoveryTracer.addSpan({
      workflowType: 'conversation',
      operation: 'conversation_recovery',
      metadata: {
        recoveryReason:
          input.recoveryReason,
        currentState:
          input.currentState,
        restoredState,
      },
    });

    // ==================================================
    // ♻️ RESTORE STATE
    // ==================================================

    await this.stateRestorer.restore({
      tenantId: input.tenantId,
      userId: input.userId,
      workflowType: 'conversation',
      currentState: input.currentState,
      recoveryReason: input.recoveryReason,
      metadata: {
        conversationId:
          input.conversationId,
        recoveryReason:
          input.recoveryReason,
        lastKnownIntent:
          input.lastKnownIntent,
      },
    });

    // ==================================================
    // 💾 UPDATE CACHE
    // ==================================================

    await this.workflowCache.setWorkflowState(
      `${input.tenantId}:${input.userId}:conversation`,
      {
        traceId: Date.now().toString(),
        tenantId: input.tenantId,
        userId: input.userId,
        type: 'SESSION',
        state: restoredState,
        payload: {
        recovered: true,
        resumedFromCheckpoint,
        lastKnownIntent:
          input.lastKnownIntent,
      },
    });

    // ==================================================
    // 📝 TIMELINE
    // ==================================================

    await this.timelineService.recordEvent({
      tenantId: input.tenantId,
      userId: input.userId,
      workflowType: 'conversation',
      event: 'CONVERSATION_RECOVERED',
      state: restoredState,
      metadata: {
        previousState:
          input.currentState,
        restoredState,
        recoveryReason:
          input.recoveryReason,
        resumedFromCheckpoint,
      },
    });

    // ==================================================
    // 📝 OBSERVABILITY
    // ==================================================

    this.logger.log('info', 'ConversationRecoveryStrategy',
      'CONVERSATION_RECOVERY_SUCCESS',
      {
        tenantId: input.tenantId,
        userId: input.userId,
        metadata: {
          conversationId:
            input.conversationId,
          recoveryReason:
            input.recoveryReason,
          previousState:
            input.currentState,
          restoredState,
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
      resumedFromCheckpoint,
      recoveryReason:
        input.recoveryReason,
      recoveredAt: new Date(),
    };
  }

  // ==================================================
  // 🧠 STATE RESOLUTION
  // ==================================================

  private resolveConversationState(
    input: ConversationRecoveryInput,
  ): string {
    switch (input.recoveryReason) {
      case RecoveryReason.RECONNECT:
        return 'RESUME_CONVERSATION';

      case RecoveryReason.TIMEOUT:
        return 'AWAITING_USER_INPUT';

      case RecoveryReason.DUPLICATE_MESSAGE:
        return 'IGNORE_DUPLICATE_AND_RESUME';

      case RecoveryReason.ABANDONED:
        return 'RESTORE_LAST_MENU';

      default:
        return 'CONVERSATION_RECOVERED';
    }
  }

  // ==================================================
  // 🔄 CHECKPOINT RECOVERY
  // ==================================================

  private canResumeFromCheckpoint(
    input: ConversationRecoveryInput,
  ): boolean {
    return !!(
      input.lastKnownIntent ||
      input.lastMessageId
    );
  }
}