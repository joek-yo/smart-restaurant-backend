// FILE: src/modules/protection/application/use-cases/recover-payment.use-case.ts

import { Injectable } from '@nestjs/common';

import { RecoveryReason } from '../../domain/enums/recovery-reason.enum';

import { PaymentRecoveryStrategy } from '../strategies/payment-recovery.strategy';
import { RecoveryCoordinatorService } from '../coordinators/recovery-coordinator.service';

import { WorkflowTimelineService } from '../services/workflow-timeline.service';
import { ProtectionLoggerService } from '../../infrastructure/observability/protection-logger.service';

/**
 * RecoverPaymentUseCase
 * ---------------------------------------------------------
 * Application entry point for PAYMENT recovery execution.
 *
 * Responsibilities:
 * - ensures safe payment recovery execution
 * - prevents duplicate charging paths
 * - escalates risky scenarios to coordinator
 * - delegates to payment recovery strategy when safe
 *
 * PAYMENT IS THE MOST CRITICAL FLOW:
 * - double charge prevention is mandatory
 * - gateway ambiguity = coordinator escalation
 * - unknown states = manual safety routing
 */

export interface RecoverPaymentInput {
  tenantId: string;
  userId: string;

  paymentId?: string;
  orderId?: string;

  currentState: string;

  recoveryReason: RecoveryReason;

  amount?: number;
  currency?: string;

  gatewayStatus?: string;

  metadata?: Record<string, any>;
}

export interface RecoverPaymentOutput {
  success: boolean;

  restoredState: string;

  recoveredAt: Date;

  paymentRetryAllowed: boolean;

  requiresManualReview: boolean;

  usedStrategy: 'payment' | 'coordinator';
}

@Injectable()
export class RecoverPaymentUseCase {
  constructor(
    private readonly paymentRecovery: PaymentRecoveryStrategy,
    private readonly recoveryCoordinator: RecoveryCoordinatorService,
    private readonly timeline: WorkflowTimelineService,
    private readonly logger: ProtectionLoggerService,
  ) {}

  // ==================================================
  // 🚀 EXECUTE PAYMENT RECOVERY
  // ==================================================

  async execute(
    input: RecoverPaymentInput,
  ): Promise<RecoverPaymentOutput> {
    const strategy = this.selectStrategy(input);

    // ==================================================
    // 🧭 COORDINATOR PATH (HIGH RISK / AMBIGUOUS STATE)
    // ==================================================

    if (strategy === 'coordinator') {
      const result =
        await this.recoveryCoordinator.executeRecovery({
          tenantId: input.tenantId,
          userId: input.userId,
          workflowType: 'payment',
          currentState: input.currentState,
          recoveryReason: input.recoveryReason,
          workflowId: input.paymentId ?? input.orderId,
        });

      return {
        success: result.success,
        restoredState: result.finalState,
        recoveredAt: result.executedAt,
        paymentRetryAllowed: false,
        requiresManualReview: true,
        usedStrategy: 'coordinator',
      };
    }

    // ==================================================
    // 💳 DIRECT PAYMENT RECOVERY PATH
    // ==================================================

    const result =
      await this.paymentRecovery.recover({
        tenantId: input.tenantId,
        userId: input.userId,
        paymentId: input.paymentId,
        orderId: input.orderId,
        currentState: input.currentState,
        recoveryReason: input.recoveryReason,
        amount: input.amount,
        currency: input.currency,
        gatewayStatus: input.gatewayStatus,
      });

    // ==================================================
    // 📝 TIMELINE EVENT
    // ==================================================

    await this.timeline.recordEvent({
      tenantId: input.tenantId,
      userId: input.userId,
      workflowType: 'payment',
      event: 'PAYMENT_RECOVERY_EXECUTED',
      state: result.restoredState,
      metadata: {
        paymentId: input.paymentId,
        orderId: input.orderId,
        recoveryReason: input.recoveryReason,
      },
    });

    // ==================================================
    // 🧾 LOGGING
    // ==================================================

    this.logger.warn(
      'RecoverPaymentUseCase',
      'EXECUTED',
      {
        tenantId: input.tenantId,
        userId: input.userId,
        metadata: {
          paymentId: input.paymentId,
          restoredState: result.restoredState,
          recoveryReason: input.recoveryReason,
        },
      },
    );

    return {
      success: result.recovered,
      restoredState: result.restoredState,
      recoveredAt: result.recoveredAt,
      paymentRetryAllowed: result.paymentRetryAllowed,
      requiresManualReview: result.requiresManualReview,
      usedStrategy: 'payment',
    };
  }

  // ==================================================
  // 🧠 STRATEGY ROUTING
  // ==================================================

  private selectStrategy(
    input: RecoverPaymentInput,
  ): 'payment' | 'coordinator' {
    // always escalate unsafe or ambiguous states
    if (!input.paymentId && !input.orderId) {
      return 'coordinator';
    }

    if (input.gatewayStatus === 'UNKNOWN') {
      return 'coordinator';
    }

    if (input.currentState === 'CHARGED_BUT_FAILED') {
      return 'coordinator';
    }

    if (input.amount && input.amount > 10000) {
      return 'coordinator';
    }

    return 'payment';
  }
}