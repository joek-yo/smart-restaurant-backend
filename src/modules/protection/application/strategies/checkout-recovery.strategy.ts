// FILE: src/modules/protection/application/strategies/checkout-recovery.strategy.ts

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
 * CheckoutRecoveryStrategy
 * ---------------------------------------------------------
 * Recovery strategy specialized for checkout workflows.
 *
 * Responsibilities:
 * - restore interrupted checkout flows
 * - recover abandoned carts
 * - restore checkout progress
 * - recover cart/session linkage
 * - restore payment preparation state
 * - prevent duplicate checkout execution
 *
 * IMPORTANT:
 * Checkout recovery is BUSINESS CRITICAL.
 */

export interface CheckoutRecoveryInput {
  tenantId: string;
  userId: string;

  checkoutId?: string;

  cartId?: string;

  currentState: string;

  recoveryReason: RecoveryReason;

  cartItemsCount?: number;

  cartValue?: number;

  metadata?: Record<string, any>;
}

export interface CheckoutRecoveryResult {
  recovered: boolean;

  previousState: string;

  restoredState: string;

  workflowStatus: WorkflowStatus;

  protectionLevel: ProtectionLevel;

  cartRecovered: boolean;

  checkoutResumed: boolean;

  recoveryReason: RecoveryReason;

  recoveredAt: Date;
}

@Injectable()
export class CheckoutRecoveryStrategy {
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
    input: CheckoutRecoveryInput,
  ): Promise<CheckoutRecoveryResult> {
    const restoredState =
      this.resolveCheckoutState(input);

    const cartRecovered =
      this.canRecoverCart(input);

    const checkoutResumed =
      restoredState !== 'CHECKOUT_RESET';

    // ==================================================
    // 🛰️ TRACE RECOVERY
    // ==================================================

    await this.recoveryTracer.addSpan({
      workflowType: 'checkout',
      operation: 'checkout_recovery',
      metadata: {
        checkoutId: input.checkoutId,
        recoveryReason:
          input.recoveryReason,
        previousState:
          input.currentState,
        restoredState,
      },
    });

    // ==================================================
    // ♻️ RESTORE CHECKOUT STATE
    // ==================================================

    await this.stateRestorer.restore({
      tenantId: input.tenantId,
      userId: input.userId,
      workflowType: 'checkout',
      currentState: input.currentState,
      targetState: restoredState,
      metadata: {
        checkoutId: input.checkoutId,
        cartId: input.cartId,
        recoveryReason:
          input.recoveryReason,
      },
    });

    // ==================================================
    // 💾 UPDATE CACHE
    // ==================================================

    await this.workflowCache.setWorkflowState({
      tenantId: input.tenantId,
      userId: input.userId,
      workflowType: 'checkout',
      state: restoredState,
      metadata: {
        checkoutId: input.checkoutId,
        cartId: input.cartId,
        recovered: true,
        cartRecovered,
        checkoutResumed,
      },
    });

    // ==================================================
    // 📝 RECORD TIMELINE
    // ==================================================

    await this.timelineService.recordEvent({
      tenantId: input.tenantId,
      userId: input.userId,
      workflowType: 'checkout',
      event: 'CHECKOUT_RECOVERED',
      state: restoredState,
      metadata: {
        checkoutId: input.checkoutId,
        cartId: input.cartId,
        previousState:
          input.currentState,
        restoredState,
        recoveryReason:
          input.recoveryReason,
      },
    });

    // ==================================================
    // 📝 OBSERVABILITY
    // ==================================================

    this.logger.warn(
      'CheckoutRecoveryStrategy',
      'CHECKOUT_RECOVERY_SUCCESS',
      {
        tenantId: input.tenantId,
        userId: input.userId,
        metadata: {
          checkoutId: input.checkoutId,
          cartId: input.cartId,
          recoveryReason:
            input.recoveryReason,
          restoredState,
          cartRecovered,
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
        ProtectionLevel.CRITICAL,
      cartRecovered,
      checkoutResumed,
      recoveryReason:
        input.recoveryReason,
      recoveredAt: new Date(),
    };
  }

  // ==================================================
  // 🧠 RESTORE TARGET STATE
  // ==================================================

  private resolveCheckoutState(
    input: CheckoutRecoveryInput,
  ): string {
    switch (input.recoveryReason) {
      case RecoveryReason.ABANDONED:
        return 'CART_RESTORED';

      case RecoveryReason.RECONNECT:
        return 'CHECKOUT_RESUMED';

      case RecoveryReason.TIMEOUT:
        return 'PAYMENT_PENDING';

      case RecoveryReason.PAYMENT_FAILED:
        return 'PAYMENT_RETRY_REQUIRED';

      case RecoveryReason.DUPLICATE_MESSAGE:
        return 'CHECKOUT_CONTINUED';

      default:
        return 'CHECKOUT_RECOVERED';
    }
  }

  // ==================================================
  // 🛒 CART RECOVERY CHECK
  // ==================================================

  private canRecoverCart(
    input: CheckoutRecoveryInput,
  ): boolean {
    return !!(
      input.cartId &&
      input.cartItemsCount &&
      input.cartItemsCount > 0
    );
  }
}