// FILE: src/modules/protection/application/strategies/payment-recovery.strategy.ts

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
 * PaymentRecoveryStrategy
 * ---------------------------------------------------------
 * Recovery strategy specialized for payment workflows.
 *
 * Responsibilities:
 * - recover stuck payment intents
 * - retry failed transactions safely
 * - restore payment session state
 * - prevent double charging
 * - handle gateway interruptions
 * - ensure idempotent payment recovery
 *
 * IMPORTANT:
 * Payment recovery is CRITICAL + HIGH RISK.
 * MUST avoid duplicate execution at all costs.
 */

export interface PaymentRecoveryInput {
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

export interface PaymentRecoveryResult {
  recovered: boolean;

  previousState: string;

  restoredState: string;

  workflowStatus: WorkflowStatus;

  protectionLevel: ProtectionLevel;

  paymentRetryAllowed: boolean;

  requiresManualReview: boolean;

  recoveryReason: RecoveryReason;

  recoveredAt: Date;
}

@Injectable()
export class PaymentRecoveryStrategy {
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
    input: PaymentRecoveryInput,
  ): Promise<PaymentRecoveryResult> {
    const restoredState =
      this.resolvePaymentState(input);

    const paymentRetryAllowed =
      this.isRetryAllowed(input);

    const requiresManualReview =
      this.requiresManualReview(input);

    // ==================================================
    // 🛰️ TRACE RECOVERY
    // ==================================================

    await this.recoveryTracer.addSpan({
      workflowType: 'payment',
      operation: 'payment_recovery',
      metadata: {
        paymentId: input.paymentId,
        orderId: input.orderId,
        recoveryReason: input.recoveryReason,
        previousState: input.currentState,
        restoredState,
      },
    });

    // ==================================================
    // 🚫 SAFETY GUARD: NO RETRY IF BLOCKED
    // ==================================================

    if (requiresManualReview) {
      await this.logger.warn('PaymentRecoveryStrategy',
        'PAYMENT_REQUIRES_MANUAL_REVIEW',
        {
          tenantId: input.tenantId,
          userId: input.userId,
          metadata: {
            paymentId: input.paymentId,
            currentState: input.currentState,
            recoveryReason: input.recoveryReason,
          },
        },
      );

      return {
        recovered: false,
        previousState: input.currentState,
        restoredState: 'MANUAL_REVIEW_REQUIRED',
        workflowStatus: WorkflowStatus.FAILED,
        protectionLevel: ProtectionLevel.FATAL,
        paymentRetryAllowed: false,
        requiresManualReview: true,
        recoveryReason: input.recoveryReason,
        recoveredAt: new Date(),
      };
    }

    // ==================================================
    // ♻️ RESTORE PAYMENT STATE
    // ==================================================

    await this.stateRestorer.restore({
      tenantId: input.tenantId,
      userId: input.userId,
      workflowType: 'payment',
      currentState: input.currentState,
      recoveryReason: input.recoveryReason,
      metadata: {
        paymentId: input.paymentId,
        orderId: input.orderId,
        recoveryReason: input.recoveryReason,
      },
    });

    // ==================================================
    // 💾 CACHE UPDATE
    // ==================================================

    await this.workflowCache.setWorkflowState(
      `${input.tenantId}:${input.userId}:payment`,
      {
        traceId: Date.now().toString(),
        tenantId: input.tenantId,
        userId: input.userId,
        type: 'SESSION',
        state: restoredState,
        payload: {
        paymentId: input.paymentId,
        orderId: input.orderId,
        recovered: true,
        paymentRetryAllowed,
      },
    });

    // ==================================================
    // 📝 TIMELINE EVENT
    // ==================================================

    await this.timelineService.recordEvent({
      tenantId: input.tenantId,
      userId: input.userId,
      workflowType: 'payment',
      event: 'PAYMENT_RECOVERED',
      state: restoredState,
      metadata: {
        paymentId: input.paymentId,
        orderId: input.orderId,
        previousState: input.currentState,
        restoredState,
        recoveryReason: input.recoveryReason,
      },
    });

    // ==================================================
    // 🧾 LOGGING
    // ==================================================

    this.logger.warn('PaymentRecoveryStrategy',
      'PAYMENT_RECOVERY_COMPLETED',
      {
        tenantId: input.tenantId,
        userId: input.userId,
        metadata: {
          paymentId: input.paymentId,
          orderId: input.orderId,
          restoredState,
          paymentRetryAllowed,
        },
      },
    );

    return {
      recovered: true,
      previousState: input.currentState,
      restoredState,
      workflowStatus: WorkflowStatus.RECOVERED,
      protectionLevel: ProtectionLevel.CRITICAL,
      paymentRetryAllowed,
      requiresManualReview: false,
      recoveryReason: input.recoveryReason,
      recoveredAt: new Date(),
    };
  }

  // ==================================================
  // 🧠 PAYMENT STATE RESOLUTION
  // ==================================================

  private resolvePaymentState(
    input: PaymentRecoveryInput,
  ): string {
    switch (input.recoveryReason) {
      case RecoveryReason.TIMEOUT:
        return 'PAYMENT_PENDING_RETRY';

      case RecoveryReason.PAYMENT_FAILED:
        return 'PAYMENT_RETRY_REQUIRED';

      case RecoveryReason.RECONNECT:
        return 'PAYMENT_RESUMED';

      case RecoveryReason.ABANDONED:
        return 'PAYMENT_RECOVERED';

      case RecoveryReason.DUPLICATE_MESSAGE:
        return 'PAYMENT_CONTINUED';

      default:
        return 'PAYMENT_RECOVERED';
    }
  }

  // ==================================================
  // 🔁 RETRY SAFETY RULES
  // ==================================================

  private isRetryAllowed(
    input: PaymentRecoveryInput,
  ): boolean {
    if (!input.paymentId) return false;

    if (input.currentState === 'SUCCESS') return false;

    if (input.currentState === 'CHARGED') return false;

    if (input.gatewayStatus === 'CAPTURED') return false;

    return true;
  }

  // ==================================================
  // 🚨 MANUAL REVIEW RULES
  // ==================================================

  private requiresManualReview(
    input: PaymentRecoveryInput,
  ): boolean {
    if (input.gatewayStatus === 'UNKNOWN') return true;

    if (input.amount && input.amount > 10000)
      return true;

    if (
      input.currentState === 'CHARGED_BUT_FAILED'
    )
      return true;

    return false;
  }
}