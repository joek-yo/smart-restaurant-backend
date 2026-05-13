// FILE: src/modules/protection/application/pipelines/recovery.pipeline.ts

import { Injectable } from '@nestjs/common';

import { RecoveryReason } from '../../domain/enums/recovery-reason.enum';

import { RecoverConversationUseCase } from '../use-cases/recover-conversation.use-case';
import { RecoverSessionUseCase } from '../use-cases/recover-session.use-case';
import { RecoverCheckoutUseCase } from '../use-cases/recover-checkout.use-case';
import { RecoverPaymentUseCase } from '../use-cases/recover-payment.use-case';
import { RestoreAbandonedCartUseCase } from '../use-cases/restore-abandoned-cart.use-case';
import { HandleTimeoutUseCase } from '../use-cases/handle-timeout.use-case';
import { HandleReconnectUseCase } from '../use-cases/handle-reconnect.use-case';

import { ValidateWorkflowConsistencyUseCase } from '../use-cases/validate-workflow-consistency.use-case';

import { WorkflowTimelineService } from '../services/workflow-timeline.service';
import { ProtectionLoggerService } from '../../infrastructure/observability/protection-logger.service';

/**
 * RecoveryPipeline
 * ---------------------------------------------------------
 * End-to-end orchestration layer for ALL recovery flows.
 *
 * Responsibilities:
 * - pre-validation (consistency checks)
 * - routing to correct recovery use-case
 * - enforcing safe execution order
 * - ensuring audit + observability
 *
 * This is the SINGLE ENTRY POINT for recovery execution.
 */

export interface RecoveryPipelineInput {
  tenantId: string;
  userId: string;

  workflowType: 'conversation' | 'session' | 'checkout' | 'payment' | 'order';

  workflowId?: string;

  currentState: string;

  recoveryReason: RecoveryReason;

  metadata?: Record<string, any>;
}

export interface RecoveryPipelineOutput {
  success: boolean;

  restoredState: string;

  workflowType: string;

  recoveredAt: Date;

  handledBy:
    | 'conversation'
    | 'session'
    | 'checkout'
    | 'payment'
    | 'cart'
    | 'timeout'
    | 'reconnect'
    | 'unknown';
}

@Injectable()
export class RecoveryPipeline {
  constructor(
    private readonly validateWorkflow: ValidateWorkflowConsistencyUseCase,

    private readonly conversationRecovery: RecoverConversationUseCase,
    private readonly sessionRecovery: RecoverSessionUseCase,
    private readonly checkoutRecovery: RecoverCheckoutUseCase,
    private readonly paymentRecovery: RecoverPaymentUseCase,
    private readonly cartRecovery: RestoreAbandonedCartUseCase,

    private readonly timeoutHandler: HandleTimeoutUseCase,
    private readonly reconnectHandler: HandleReconnectUseCase,

    private readonly timeline: WorkflowTimelineService,
    private readonly logger: ProtectionLoggerService,
  ) {}

  // ==================================================
  // 🚀 PIPELINE ENTRY POINT
  // ==================================================

  async execute(
    input: RecoveryPipelineInput,
  ): Promise<RecoveryPipelineOutput> {
    // ==================================================
    // 🔍 PRE-CHECK: WORKFLOW CONSISTENCY
    // ==================================================

    const validation =
      await this.validateWorkflow.execute({
        tenantId: input.tenantId,
        userId: input.userId,
        workflowType: input.workflowType,
        workflowId: input.workflowId,
        currentState: input.currentState,
      });

    if (!validation.safeToProceed) {
      this.logger.warn(
        'RecoveryPipeline',
        'BLOCKED_INCONSISTENT_WORKFLOW',
        {
          tenantId: input.tenantId,
          userId: input.userId,
          metadata: {
            workflowType: input.workflowType,
            anomalyType: validation.anomalyType,
          },
        },
      );

      return {
        success: false,
        restoredState: 'BLOCKED_INCONSISTENT_STATE',
        workflowType: input.workflowType,
        recoveredAt: new Date(),
        handledBy: 'unknown',
      };
    }

    // ==================================================
    // 🧭 ROUTING LOGIC
    // ==================================================

    const handledBy = this.resolveHandler(input);

    let result: any;

    switch (handledBy) {
      case 'conversation':
        result = await this.conversationRecovery.execute({
          tenantId: input.tenantId,
          userId: input.userId,
          conversationId: input.workflowId,
          currentState: input.currentState,
          recoveryReason: input.recoveryReason,
        });
        break;

      case 'session':
        result = await this.sessionRecovery.execute({
          tenantId: input.tenantId,
          userId: input.userId,
          sessionId: input.workflowId,
          currentState: input.currentState,
          recoveryReason: input.recoveryReason,
        });
        break;

      case 'checkout':
        result = await this.checkoutRecovery.execute({
          tenantId: input.tenantId,
          userId: input.userId,
          checkoutId: input.workflowId,
          currentState: input.currentState,
          recoveryReason: input.recoveryReason,
        });
        break;

      case 'payment':
        result = await this.paymentRecovery.execute({
          tenantId: input.tenantId,
          userId: input.userId,
          paymentId: input.workflowId,
          currentState: input.currentState,
          recoveryReason: input.recoveryReason,
        });
        break;

      case 'cart':
        result = await this.cartRecovery.execute({
          tenantId: input.tenantId,
          userId: input.userId,
          cartId: input.workflowId!,
          currentState: input.currentState,
          recoveryReason: input.recoveryReason,
        });
        break;

      case 'timeout':
        result = await this.timeoutHandler.execute({
          tenantId: input.tenantId,
          userId: input.userId,
          workflowType: input.workflowType,
          workflowId: input.workflowId,
          currentState: input.currentState,
          timeoutMs: input.metadata?.timeoutMs,
        });
        break;

      case 'reconnect':
        result = await this.reconnectHandler.execute({
          tenantId: input.tenantId,
          userId: input.userId,
          workflowType: input.workflowType,
          workflowId: input.workflowId,
          currentState: input.currentState,
          lastKnownState: input.metadata?.lastKnownState,
        });
        break;

      default:
        result = {
          success: false,
          restoredState: 'NO_HANDLER_FOUND',
        };
    }

    // ==================================================
    // 📝 TIMELINE EVENT
    // ==================================================

    await this.timeline.recordEvent({
      tenantId: input.tenantId,
      userId: input.userId,
      workflowType: input.workflowType,
      event: 'RECOVERY_PIPELINE_EXECUTED',
      state: result.restoredState,
      metadata: {
        handledBy,
        workflowId: input.workflowId,
        recoveryReason: input.recoveryReason,
      },
    });

    // ==================================================
    // 🧾 LOGGING
    // ==================================================

    this.logger.log('RecoveryPipeline', 'EXECUTED', {
      tenantId: input.tenantId,
      userId: input.userId,
      metadata: {
        workflowType: input.workflowType,
        handledBy,
        restoredState: result.restoredState,
      },
    });

    return {
      success: result.success ?? result.recovered ?? false,
      restoredState: result.restoredState,
      workflowType: input.workflowType,
      recoveredAt: new Date(),
      handledBy,
    };
  }

  // ==================================================
  // 🧠 ROUTING DECISION ENGINE
  // ==================================================

  private resolveHandler(
    input: RecoveryPipelineInput,
  ):
    | 'conversation'
    | 'session'
    | 'checkout'
    | 'payment'
    | 'cart'
    | 'timeout'
    | 'reconnect'
    | 'unknown' {
    if (input.recoveryReason === RecoveryReason.TIMEOUT)
      return 'timeout';

    if (input.recoveryReason === RecoveryReason.RECONNECT)
      return 'reconnect';

    if (
      input.workflowType === 'checkout' &&
      !input.workflowId
    )
      return 'cart';

    return input.workflowType;
  }
}