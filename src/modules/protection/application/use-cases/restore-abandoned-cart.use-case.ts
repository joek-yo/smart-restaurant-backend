// FILE: src/modules/protection/application/use-cases/restore-abandoned-cart.use-case.ts

import { Injectable } from '@nestjs/common';

import { RecoveryReason } from '../../domain/enums/recovery-reason.enum';

import { AbandonedCartStrategy } from '../strategies/abandoned-cart.strategy';
import { RecoveryCoordinatorService } from '../coordinators/recovery-coordinator.service';

import { WorkflowTimelineService } from '../services/workflow-timeline.service';
import { ProtectionLoggerService } from '../../infrastructure/observability/protection-logger.service';

/**
 * RestoreAbandonedCartUseCase
 * ---------------------------------------------------------
 * Application entry point for SAFE abandoned cart restoration.
 *
 * Responsibilities:
 * - restore cart state without triggering checkout/payment
 * - validate cart eligibility for recovery
 * - prevent unsafe or expired restoration
 * - escalate risky cases to coordinator
 *
 * IMPORTANT:
 * This is PRE-CHECKOUT ONLY.
 * It MUST NOT trigger payment or checkout flows.
 */

export interface RestoreAbandonedCartInput {
  tenantId: string;
  userId: string;

  cartId: string;

  currentState: string;

  recoveryReason: RecoveryReason;

  cartItemsCount?: number;

  cartValue?: number;

  lastActivityAt?: Date;

  metadata?: Record<string, any>;
}

export interface RestoreAbandonedCartOutput {
  success: boolean;

  restoredState: string;

  recoveredAt: Date;

  cartRestored: boolean;

  checkoutReady: boolean;

  usedStrategy: 'cart' | 'coordinator';
}

@Injectable()
export class RestoreAbandonedCartUseCase {
  constructor(
    private readonly abandonedCartStrategy: AbandonedCartStrategy,

    private readonly recoveryCoordinator: RecoveryCoordinatorService,

    private readonly timeline: WorkflowTimelineService,

    private readonly logger: ProtectionLoggerService,
  ) {}

  // ==================================================
  // 🚀 EXECUTE ABANDONED CART RESTORATION
  // ==================================================

  async execute(
    input: RestoreAbandonedCartInput,
  ): Promise<RestoreAbandonedCartOutput> {
    const strategy = this.selectStrategy(input);

    // ==================================================
    // 🧭 COORDINATOR PATH (RISK ESCALATION)
    // ==================================================

    if (strategy === 'coordinator') {
      const result =
        await this.recoveryCoordinator.executeRecovery({
          tenantId: input.tenantId,
          userId: input.userId,
          workflowType: 'checkout',
          currentState: input.currentState,
          recoveryReason: input.recoveryReason,
          workflowId: input.cartId,
        });

      return {
        success: result.success,
        restoredState: result.finalState,
        recoveredAt: result.executedAt,
        cartRestored: true,
        checkoutReady: true,
        usedStrategy: 'coordinator',
      };
    }

    // ==================================================
    // 🛒 SAFE CART RESTORATION PATH
    // ==================================================

    const result =
      await this.abandonedCartStrategy.recover({
        tenantId: input.tenantId,
        userId: input.userId,
        cartId: input.cartId,
        currentState: input.currentState,
        recoveryReason: input.recoveryReason,
        cartItemsCount: input.cartItemsCount,
        cartValue: input.cartValue,
        lastActivityAt: input.lastActivityAt,
      });

    // ==================================================
    // 📝 TIMELINE EVENT
    // ==================================================

    await this.timeline.recordEvent({
      tenantId: input.tenantId,
      userId: input.userId,
      workflowType: 'checkout',
      event: 'ABANDONED_CART_RESTORED',
      state: result.restoredState,
      metadata: {
        cartId: input.cartId,
        recoveryReason: input.recoveryReason,
      },
    });

    // ==================================================
    // 🧾 LOGGING
    // ==================================================

    this.logger.log(
      'RestoreAbandonedCartUseCase',
      'EXECUTED',
      {
        tenantId: input.tenantId,
        userId: input.userId,
        metadata: {
          cartId: input.cartId,
          restoredState: result.restoredState,
          cartRestored: result.cartRestored,
        },
      },
    );

    return {
      success: result.recovered,
      restoredState: result.restoredState,
      recoveredAt: result.recoveredAt,
      cartRestored: result.cartRestored,
      checkoutReady: result.checkoutReady,
      usedStrategy: 'cart',
    };
  }

  // ==================================================
  // 🧠 STRATEGY SELECTION
  // ==================================================

  private selectStrategy(
    input: RestoreAbandonedCartInput,
  ): 'cart' | 'coordinator' {
    // escalate if cart is invalid or risky state
    if (!input.cartId) return 'coordinator';

    if (!input.cartItemsCount || input.cartItemsCount <= 0)
      return 'coordinator';

    if (input.cartValue && input.cartValue > 20000)
      return 'coordinator';

    if (input.recoveryReason === RecoveryReason.PAYMENT_FAILED)
      return 'coordinator';

    return 'cart';
  }
}