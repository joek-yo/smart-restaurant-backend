// FILE: src/modules/protection/application/use-cases/recover-checkout.use-case.ts

import { Injectable } from '@nestjs/common';

import { RecoveryReason } from '../../domain/enums/recovery-reason.enum';

import { CheckoutRecoveryStrategy } from '../strategies/checkout-recovery.strategy';
import { AbandonedCartStrategy } from '../strategies/abandoned-cart.strategy';

import { RecoveryCoordinatorService } from '../coordinators/recovery-coordinator.service';

import { WorkflowTimelineService } from '../services/workflow-timeline.service';
import { ProtectionLoggerService } from '../../infrastructure/observability/protection-logger.service';

/**
 * RecoverCheckoutUseCase
 * ---------------------------------------------------------
 * Application entry point for CHECKOUT recovery execution.
 *
 * Responsibilities:
 * - decides whether to restore cart or full checkout
 * - triggers correct recovery strategy
 * - optionally escalates to coordinator
 *
 * Checkout is HIGH VALUE + HIGH RISK:
 * - cart recovery (low risk)
 * - checkout recovery (medium/high risk)
 * - payment-linked checkout (critical escalation)
 */

export interface RecoverCheckoutInput {
  tenantId: string;
  userId: string;

  checkoutId?: string;
  cartId?: string;

  currentState: string;

  recoveryReason: RecoveryReason;

  cartItemsCount?: number;
  cartValue?: number;

  gatewayStatus?: string;

  metadata?: Record<string, any>;
}

export interface RecoverCheckoutOutput {
  success: boolean;

  restoredState: string;

  recoveredAt: Date;

  cartRestored: boolean;

  checkoutResumed: boolean;

  usedStrategy: 'cart' | 'checkout' | 'coordinator';
}

@Injectable()
export class RecoverCheckoutUseCase {
  constructor(
    private readonly checkoutRecovery: CheckoutRecoveryStrategy,
    private readonly abandonedCartRecovery: AbandonedCartStrategy,
    private readonly recoveryCoordinator: RecoveryCoordinatorService,
    private readonly timeline: WorkflowTimelineService,
    private readonly logger: ProtectionLoggerService,
  ) {}

  // ==================================================
  // 🚀 EXECUTE CHECKOUT RECOVERY
  // ==================================================

  async execute(
    input: RecoverCheckoutInput,
  ): Promise<RecoverCheckoutOutput> {
    const strategy = this.selectStrategy(input);

    // ==================================================
    // 🧭 COORDINATOR PATH (CRITICAL CASES)
    // ==================================================

    if (strategy === 'coordinator') {
      const result =
        await this.recoveryCoordinator.executeRecovery({
          tenantId: input.tenantId,
          userId: input.userId,
          workflowType: 'checkout',
          currentState: input.currentState,
          recoveryReason: input.recoveryReason,
          workflowId: input.checkoutId ?? input.cartId,
        });

      return {
        success: result.success,
        restoredState: result.finalState,
        recoveredAt: result.executedAt,
        cartRestored: true,
        checkoutResumed: true,
        usedStrategy: 'coordinator',
      };
    }

    // ==================================================
    // 🛒 CART RECOVERY PATH
    // ==================================================

    if (strategy === 'cart') {
      const result =
        await this.abandonedCartRecovery.recover({
          tenantId: input.tenantId,
          userId: input.userId,
          cartId: input.cartId!,
          currentState: input.currentState,
          recoveryReason: input.recoveryReason,
          cartItemsCount: input.cartItemsCount,
          cartValue: input.cartValue,
        });

      await this.timeline.recordEvent({
        tenantId: input.tenantId,
        userId: input.userId,
        workflowType: 'checkout',
        event: 'CART_RECOVERY_EXECUTED',
        state: result.restoredState,
        metadata: {
          cartId: input.cartId,
          recoveryReason: input.recoveryReason,
        },
      });

      this.logger.log(
        'RecoverCheckoutUseCase',
        'CART_RECOVERY_EXECUTED',
        {
          tenantId: input.tenantId,
          userId: input.userId,
          metadata: {
            cartId: input.cartId,
            restoredState: result.restoredState,
          },
        },
      );

      return {
        success: result.recovered,
        restoredState: result.restoredState,
        recoveredAt: result.recoveredAt,
        cartRestored: result.cartRestored,
        checkoutResumed: result.checkoutReady,
        usedStrategy: 'cart',
      };
    }

    // ==================================================
    // 🧾 FULL CHECKOUT RECOVERY PATH
    // ==================================================

    const result =
      await this.checkoutRecovery.recover({
        tenantId: input.tenantId,
        userId: input.userId,
        checkoutId: input.checkoutId,
        cartId: input.cartId,
        currentState: input.currentState,
        recoveryReason: input.recoveryReason,
        cartItemsCount: input.cartItemsCount,
        cartValue: input.cartValue,
        gatewayStatus: input.gatewayStatus,
      });

    await this.timeline.recordEvent({
      tenantId: input.tenantId,
      userId: input.userId,
      workflowType: 'checkout',
      event: 'CHECKOUT_RECOVERY_EXECUTED',
      state: result.restoredState,
      metadata: {
        checkoutId: input.checkoutId,
        cartId: input.cartId,
        recoveryReason: input.recoveryReason,
      },
    });

    this.logger.log(
      'RecoverCheckoutUseCase',
      'CHECKOUT_RECOVERY_EXECUTED',
      {
        tenantId: input.tenantId,
        userId: input.userId,
        metadata: {
          checkoutId: input.checkoutId,
          restoredState: result.restoredState,
        },
      },
    );

    return {
      success: result.recovered,
      restoredState: result.restoredState,
      recoveredAt: result.recoveredAt,
      cartRestored: result.cartRecovered,
      checkoutResumed: result.checkoutResumed,
      usedStrategy: 'checkout',
    };
  }

  // ==================================================
  // 🧠 STRATEGY SELECTION
  // ==================================================

  private selectStrategy(
    input: RecoverCheckoutInput,
  ): 'cart' | 'checkout' | 'coordinator' {
    // Coordinator escalation rules (critical risk)
    if (
      input.gatewayStatus === 'UNKNOWN' ||
      input.recoveryReason === RecoveryReason.PAYMENT_FAILED
    ) {
      return 'coordinator';
    }

    // Pure cart recovery (no checkout started)
    if (
      input.cartId &&
      !input.checkoutId &&
      input.cartItemsCount &&
      input.cartItemsCount > 0
    ) {
      return 'cart';
    }

    // Default full checkout recovery
    return 'checkout';
  }
}