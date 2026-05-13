// FILE: src/modules/protection/application/use-cases/handle-timeout.use-case.ts

import { Injectable } from '@nestjs/common';

import { RecoveryReason } from '../../domain/enums/recovery-reason.enum';

import { RecoveryCoordinatorService } from '../coordinators/recovery-coordinator.service';

import { WorkflowTimelineService } from '../services/workflow-timeline.service';
import { ProtectionLoggerService } from '../../infrastructure/observability/protection-logger.service';

/**
 * HandleTimeoutUseCase
 * ---------------------------------------------------------
 * Entry point for handling workflow timeouts.
 *
 * Responsibilities:
 * - classify timeout severity
 * - decide recovery vs escalation
 * - trigger coordinated recovery when needed
 * - ensure timeline + audit logging
 *
 * TIMEOUTS ARE GENERALLY SYSTEMIC ISSUES:
 * - may affect conversation/session/checkout/payment
 * - require cautious recovery routing
 */

export interface HandleTimeoutInput {
  tenantId: string;
  userId: string;

  workflowType: 'conversation' | 'session' | 'checkout' | 'payment' | 'order';

  workflowId?: string;

  currentState: string;

  timeoutMs?: number;

  metadata?: Record<string, any>;
}

export interface HandleTimeoutOutput {
  success: boolean;

  recovered: boolean;

  restoredState: string;

  handledAt: Date;

  escalated: boolean;
}

@Injectable()
export class HandleTimeoutUseCase {
  constructor(
    private readonly recoveryCoordinator: RecoveryCoordinatorService,
    private readonly timeline: WorkflowTimelineService,
    private readonly logger: ProtectionLoggerService,
  ) {}

  // ==================================================
  // 🚀 EXECUTE TIMEOUT HANDLING
  // ==================================================

  async execute(
    input: HandleTimeoutInput,
  ): Promise<HandleTimeoutOutput> {
    const escalated = this.shouldEscalate(input);

    // ==================================================
    // 🧭 ESCALATION PATH (CRITICAL TIMEOUTS)
    // ==================================================

    if (escalated) {
      const result =
        await this.recoveryCoordinator.executeRecovery({
          tenantId: input.tenantId,
          userId: input.userId,
          workflowType: input.workflowType,
          currentState: input.currentState,
          recoveryReason: RecoveryReason.TIMEOUT,
          workflowId: input.workflowId,
        });

      await this.timeline.recordEvent({
        tenantId: input.tenantId,
        userId: input.userId,
        workflowType: input.workflowType,
        event: 'TIMEOUT_RECOVERY_ESCALATED',
        state: result.finalState,
        metadata: {
          workflowId: input.workflowId,
          timeoutMs: input.timeoutMs,
        },
      });

      this.logger.warn(
        'HandleTimeoutUseCase',
        'TIMEOUT_ESCALATED',
        {
          tenantId: input.tenantId,
          userId: input.userId,
          metadata: {
            workflowType: input.workflowType,
            workflowId: input.workflowId,
          },
        },
      );

      return {
        success: result.success,
        recovered: result.success,
        restoredState: result.finalState,
        handledAt: result.executedAt,
        escalated: true,
      };
    }

    // ==================================================
    // ♻️ LIGHTWEIGHT TIMEOUT RECOVERY
    // ==================================================

    const restoredState = this.resolveTimeoutState(input);

    await this.timeline.recordEvent({
      tenantId: input.tenantId,
      userId: input.userId,
      workflowType: input.workflowType,
      event: 'TIMEOUT_HANDLED',
      state: restoredState,
      metadata: {
        workflowId: input.workflowId,
        timeoutMs: input.timeoutMs,
      },
    });

    this.logger.log(
      'HandleTimeoutUseCase',
      'TIMEOUT_HANDLED',
      {
        tenantId: input.tenantId,
        userId: input.userId,
        metadata: {
          workflowType: input.workflowType,
          restoredState,
        },
      },
    );

    return {
      success: true,
      recovered: true,
      restoredState,
      handledAt: new Date(),
      escalated: false,
    };
  }

  // ==================================================
  // 🧠 ESCALATION RULES
  // ==================================================

  private shouldEscalate(input: HandleTimeoutInput): boolean {
    // payment + checkout always escalate
    if (
      input.workflowType === 'payment' ||
      input.workflowType === 'checkout'
    ) {
      return true;
    }

    // long timeout indicates system instability
    if (input.timeoutMs && input.timeoutMs > 60_000) {
      return true;
    }

    // missing workflow context is risky
    if (!input.workflowId) {
      return true;
    }

    return false;
  }

  // ==================================================
  // 🧠 SIMPLE TIMEOUT RESOLUTION
  // ==================================================

  private resolveTimeoutState(
    input: HandleTimeoutInput,
  ): string {
    switch (input.workflowType) {
      case 'conversation':
        return 'AWAITING_USER_RESPONSE';

      case 'session':
        return 'SESSION_EXPIRED_RESTORED';

      case 'checkout':
        return 'CHECKOUT_PAUSED';

      case 'order':
        return 'ORDER_PENDING';

      case 'payment':
        return 'PAYMENT_PENDING';

      default:
        return 'RECOVERED_FROM_TIMEOUT';
    }
  }
}