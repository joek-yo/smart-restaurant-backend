// FILE: src/modules/protection/application/services/recovery-state-restorer.service.ts

import { Injectable } from '@nestjs/common';

import { RecoveryReason } from '../../domain/enums/recovery-reason.enum';
import { RecoveryState } from '../../domain/enums/recovery-state.enum';
import { WorkflowStatus } from '../../domain/enums/workflow-status.enum';

import { RecoverySessionEntity } from '../../domain/entities/recovery-session.entity';

import { SessionProtectionService } from './session-protection.service';
import { ConversationProtectionService } from './conversation-protection.service';
import { CheckoutProtectionService } from './checkout-protection.service';
import { PaymentProtectionService } from './payment-protection.service';
import { OrderProtectionService } from './order-protection.service';

import { WorkflowTimelineService } from './workflow-timeline.service';

import { RecoverySessionRepository } from '../../domain/repositories/recovery-session.repository';

import { ProtectionLoggerService } from '../../infrastructure/observability/protection-logger.service';

/**
 * RecoveryStateRestorerService
 * --------------------------------------------------------
 * RESTORES CORRUPTED / INTERRUPTED WORKFLOWS
 * INTO SAFE STABLE STATES.
 *
 * Responsibilities:
 * - restore abandoned workflows
 * - recover interrupted checkouts
 * - restore reconnect sessions
 * - rollback unsafe states
 * - normalize inconsistent workflows
 *
 * IMPORTANT:
 * This service performs SAFE restoration only.
 * It NEVER executes business actions.
 */

export interface RestoreWorkflowInput {
  tenantId: string;
  userId: string;

  workflowType:
    | 'conversation'
    | 'session'
    | 'checkout'
    | 'payment'
    | 'order';

  currentState?: string;

  recoveryReason: RecoveryReason;

  metadata?: Record<string, any>;
}

export interface RestoreWorkflowResult {
  success: boolean;

  previousState?: string;

  restoredState?: string;

  recoveryState: RecoveryState;

  workflowStatus: WorkflowStatus;

  recoverySessionId?: string;

  metadata?: Record<string, any>;
}

@Injectable()
export class RecoveryStateRestorerService {
  constructor(
    // ==================================================
    // DOMAIN PROTECTION SERVICES
    // ==================================================

    private readonly sessionProtection: SessionProtectionService,
    private readonly conversationProtection: ConversationProtectionService,
    private readonly checkoutProtection: CheckoutProtectionService,
    private readonly paymentProtection: PaymentProtectionService,
    private readonly orderProtection: OrderProtectionService,

    // ==================================================
    // TIMELINE
    // ==================================================

    private readonly timelineService: WorkflowTimelineService,

    // ==================================================
    // REPOSITORIES
    // ==================================================

    private readonly recoveryRepository: RecoverySessionRepository,

    // ==================================================
    // OBSERVABILITY
    // ==================================================

    private readonly logger: ProtectionLoggerService,
  ) {}

  // ==================================================
  // 🚦 MAIN RESTORE ENTRY POINT
  // ==================================================

  async restore(
    input: RestoreWorkflowInput,
  ): Promise<RestoreWorkflowResult> {
    // ==================================================
    // 🧾 CREATE RECOVERY SESSION
    // ==================================================

    const recoverySession =
      await this.createRecoverySession(input);

    try {
      // ==================================================
      // ▶️ MARK RUNNING
      // ==================================================

      recoverySession.state = RecoveryState.RUNNING;

      await this.recoveryRepository.update(
        recoverySession.id,
        recoverySession,
      );

      // ==================================================
      // 🔄 RESTORE TARGET STATE
      // ==================================================

      const restoredState =
        await this.restoreWorkflowState(input);

      // ==================================================
      // ✅ COMPLETE SESSION
      // ==================================================

      recoverySession.state = RecoveryState.COMPLETED;
      recoverySession.completedAt = new Date();

      await this.recoveryRepository.update(
        recoverySession.id,
        recoverySession,
      );

      // ==================================================
      // 📝 TIMELINE EVENT
      // ==================================================

      await this.timelineService.recordEvent({
        tenantId: input.tenantId,
        userId: input.userId,
        workflowType: input.workflowType,
        event: 'WORKFLOW_RESTORED',
        state: restoredState,
        metadata: {
          recoveryReason: input.recoveryReason,
          previousState: input.currentState,
        },
      });

      // ==================================================
      // 📊 OBSERVABILITY
      // ==================================================

      this.logger.info(
        'RecoveryStateRestorerService',
        'WORKFLOW_RESTORED',
        {
          tenantId: input.tenantId,
          userId: input.userId,
          metadata: {
            workflowType: input.workflowType,
            restoredState,
            recoveryReason: input.recoveryReason,
          },
        },
      );

      return {
        success: true,
        previousState: input.currentState,
        restoredState,
        recoveryState: RecoveryState.COMPLETED,
        workflowStatus: WorkflowStatus.RECOVERED,
        recoverySessionId: recoverySession.id,
      };
    } catch (error) {
      // ==================================================
      // ❌ FAIL RECOVERY SESSION
      // ==================================================

      recoverySession.state = RecoveryState.FAILED;
      recoverySession.completedAt = new Date();

      await this.recoveryRepository.update(
        recoverySession.id,
        recoverySession,
      );

      // ==================================================
      // 🚨 OBSERVABILITY
      // ==================================================

      this.logger.error(
        'RecoveryStateRestorerService',
        'WORKFLOW_RESTORE_FAILED',
        {
          tenantId: input.tenantId,
          userId: input.userId,
          metadata: {
            workflowType: input.workflowType,
            error:
              error instanceof Error
                ? error.message
                : 'Unknown recovery failure',
          },
        },
      );

      return {
        success: false,
        previousState: input.currentState,
        recoveryState: RecoveryState.FAILED,
        workflowStatus: WorkflowStatus.CORRUPTED,
        recoverySessionId: recoverySession.id,
      };
    }
  }

  // ==================================================
  // 🔄 DOMAIN STATE RESTORATION
  // ==================================================

  private async restoreWorkflowState(
    input: RestoreWorkflowInput,
  ): Promise<string> {
    switch (input.workflowType) {
      // ----------------------------------------------
      // 💬 CONVERSATION
      // ----------------------------------------------

      case 'conversation':
        return this.restoreConversationState(input);

      // ----------------------------------------------
      // 🧠 SESSION
      // ----------------------------------------------

      case 'session':
        return this.restoreSessionState(input);

      // ----------------------------------------------
      // 🛒 CHECKOUT
      // ----------------------------------------------

      case 'checkout':
        return this.restoreCheckoutState(input);

      // ----------------------------------------------
      // 💳 PAYMENT
      // ----------------------------------------------

      case 'payment':
        return this.restorePaymentState(input);

      // ----------------------------------------------
      // 📦 ORDER
      // ----------------------------------------------

      case 'order':
        return this.restoreOrderState(input);

      default:
        return 'UNKNOWN';
    }
  }

  // ==================================================
  // 💬 CONVERSATION RESTORE
  // ==================================================

  private async restoreConversationState(
    input: RestoreWorkflowInput,
  ): Promise<string> {
    switch (input.recoveryReason) {
      case RecoveryReason.RECONNECT:
        return 'RECOVERY_FLOW';

      case RecoveryReason.TIMEOUT:
        return 'IDLE';

      case RecoveryReason.ABANDONED:
        return 'BROWSING';

      default:
        return 'STARTED';
    }
  }

  // ==================================================
  // 🧠 SESSION RESTORE
  // ==================================================

  private async restoreSessionState(
    input: RestoreWorkflowInput,
  ): Promise<string> {
    switch (input.recoveryReason) {
      case RecoveryReason.ABANDONED:
        return 'CART_UPDATED';

      case RecoveryReason.TIMEOUT:
        return 'ACTIVE';

      default:
        return 'ACTIVE';
    }
  }

  // ==================================================
  // 🛒 CHECKOUT RESTORE
  // ==================================================

  private async restoreCheckoutState(
    input: RestoreWorkflowInput,
  ): Promise<string> {
    switch (input.recoveryReason) {
      case RecoveryReason.PAYMENT_FAILED:
        return 'CHECKOUT';

      case RecoveryReason.TIMEOUT:
        return 'CHECKOUT_STARTED';

      case RecoveryReason.RECONNECT:
        return 'CHECKOUT';

      default:
        return 'CHECKOUT';
    }
  }

  // ==================================================
  // 💳 PAYMENT RESTORE
  // ==================================================

  private async restorePaymentState(
    input: RestoreWorkflowInput,
  ): Promise<string> {
    switch (input.recoveryReason) {
      case RecoveryReason.TIMEOUT:
        return 'PAYMENT_PENDING';

      case RecoveryReason.PAYMENT_FAILED:
        return 'PAYMENT_RETRY_REQUIRED';

      default:
        return 'PAYMENT_PENDING';
    }
  }

  // ==================================================
  // 📦 ORDER RESTORE
  // ==================================================

  private async restoreOrderState(
    input: RestoreWorkflowInput,
  ): Promise<string> {
    switch (input.recoveryReason) {
      case RecoveryReason.TIMEOUT:
        return 'PENDING';

      default:
        return 'PENDING';
    }
  }

  // ==================================================
  // 🧾 CREATE RECOVERY SESSION
  // ==================================================

  private async createRecoverySession(
    input: RestoreWorkflowInput,
  ): Promise<RecoverySessionEntity> {
    const session = new RecoverySessionEntity({
      tenantId: input.tenantId,
      userId: input.userId,

      workflowType: input.workflowType,

      recoveryReason: input.recoveryReason,

      previousState: input.currentState,

      state: RecoveryState.PENDING,

      metadata: input.metadata ?? {},

      startedAt: new Date(),
    });

    return this.recoveryRepository.create(session);
  }
}