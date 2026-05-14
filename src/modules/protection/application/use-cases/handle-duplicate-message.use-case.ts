// FILE: src/modules/protection/application/use-cases/handle-duplicate-message.use-case.ts

import { Injectable } from '@nestjs/common';

import { RecoveryReason } from '../../domain/enums/recovery-reason.enum';

import { IdempotencyProtectionService } from '../services/idempotency-protection.service';
import { RecoveryCoordinatorService } from '../coordinators/recovery-coordinator.service';

import { WorkflowTimelineService } from '../services/workflow-timeline.service';
import { ProtectionLoggerService } from '../../infrastructure/observability/protection-logger.service';

/**
 * HandleDuplicateMessageUseCase
 * ---------------------------------------------------------
 * Entry point for duplicate inbound message protection.
 *
 * Responsibilities:
 * - detect duplicate messages safely
 * - prevent double-processing of workflows
 * - ensure idempotent behavior across all domains
 * - optionally escalate suspicious duplication patterns
 *
 * IMPORTANT:
 * Duplicate messages are NORMAL in distributed systems.
 * But MUST NOT trigger duplicate execution.
 */

export interface HandleDuplicateMessageInput {
  tenantId: string;
  userId: string;

  workflowType: 'conversation' | 'session' | 'checkout' | 'payment' | 'order';

  messageId: string;

  workflowId?: string;

  currentState: string;

  payloadHash?: string;

  metadata?: Record<string, any>;
}

export interface HandleDuplicateMessageOutput {
  isDuplicate: boolean;

  handled: boolean;

  restoredState: string;

  ignored: boolean;

  processedAt: Date;

  usedStrategy: 'idempotent' | 'coordinator';
}

@Injectable()
export class HandleDuplicateMessageUseCase {
  constructor(
    private readonly idempotency: IdempotencyProtectionService,
    private readonly recoveryCoordinator: RecoveryCoordinatorService,
    private readonly timeline: WorkflowTimelineService,
    private readonly logger: ProtectionLoggerService,
  ) {}

  // ==================================================
  // 🚀 EXECUTE DUPLICATE MESSAGE HANDLING
  // ==================================================

  async execute(
    input: HandleDuplicateMessageInput,
  ): Promise<HandleDuplicateMessageOutput> {
    const isDuplicate = await this.idempotency.isDuplicate({
      tenantId: input.tenantId,
      userId: input.userId,
      workflowType: input.workflowType,
      messageId: input.messageId,
      payloadHash: input.payloadHash,
    });

    // ==================================================
    // ♻️ NOT DUPLICATE → NORMAL FLOW CONTINUES ELSEWHERE
    // ==================================================

    if (!isDuplicate) {
      this.logger.log('info', 'HandleDuplicateMessageUseCase',
        'NOT_DUPLICATE_SKIPPED',
        {
          tenantId: input.tenantId,
          userId: input.userId,
          metadata: {
            messageId: input.messageId,
            workflowType: input.workflowType,
          },
        },
      );

      return {
        isDuplicate: false,
        handled: false,
        ignored: false,
        restoredState: input.currentState,
        processedAt: new Date(),
        usedStrategy: 'idempotent',
      };
    }

    // ==================================================
    // 🧠 ESCALATION RULE (SUSPICIOUS DUPLICATION)
    // ==================================================

    const suspicious =
      this.isSuspiciousDuplicate(input);

    if (suspicious) {
      const result =
        await this.recoveryCoordinator.executeRecovery({
          tenantId: input.tenantId,
          userId: input.userId,
          workflowType: input.workflowType,
          currentState: input.currentState,
          recoveryReason: RecoveryReason.DUPLICATE_MESSAGE,
          reason: RecoveryReason.DUPLICATE_MESSAGE,
          workflowId: input.workflowId,
        });

      return {
        isDuplicate: true,
        handled: true,
        ignored: false,
        restoredState: result.finalState,
        processedAt: result.executedAt,
        usedStrategy: 'coordinator',
      };
    }

    // ==================================================
    // 🧊 SAFE IGNORE PATH (NORMAL DUPLICATE)
    // ==================================================

    await this.timeline.recordEvent({
      tenantId: input.tenantId,
      userId: input.userId,
      workflowType: input.workflowType,
      event: 'DUPLICATE_MESSAGE_IGNORED',
      state: input.currentState,
      metadata: {
        messageId: input.messageId,
        workflowId: input.workflowId,
      },
    });

    this.logger.warn('HandleDuplicateMessageUseCase',
      'DUPLICATE_IGNORED',
      {
        tenantId: input.tenantId,
        userId: input.userId,
        metadata: {
          messageId: input.messageId,
          workflowType: input.workflowType,
        },
      },
    );

    return {
      isDuplicate: true,
      handled: true,
      ignored: true,
      restoredState: input.currentState,
      processedAt: new Date(),
      usedStrategy: 'idempotent',
    };
  }

  // ==================================================
  // 🧠 DUPLICATE RISK ANALYSIS
  // ==================================================

  private isSuspiciousDuplicate(
    input: HandleDuplicateMessageInput,
  ): boolean {
    // duplicate with missing workflow context = suspicious
    if (!input.workflowId) return true;

    // payment duplication is always risky
    if (input.workflowType === 'payment') return true;

    // checkout duplication can cause double-order risk
    if (input.workflowType === 'checkout') return true;

    return false;
  }
}