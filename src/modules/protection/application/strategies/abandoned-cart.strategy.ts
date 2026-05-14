// FILE: src/modules/protection/application/strategies/abandoned-cart.strategy.ts

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
 * AbandonedCartStrategy
 * ---------------------------------------------------------
 * Recovery strategy for abandoned checkout carts.
 *
 * Responsibilities:
 * - restore abandoned cart state
 * - rehydrate cart items
 * - resume checkout intent
 * - handle expired sessions safely
 * - prepare checkout re-entry point
 *
 * IMPORTANT:
 * This is NOT payment recovery.
 * This is pre-checkout restoration only.
 */

export interface AbandonedCartInput {
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

export interface AbandonedCartResult {
  recovered: boolean;

  previousState: string;

  restoredState: string;

  workflowStatus: WorkflowStatus;

  protectionLevel: ProtectionLevel;

  cartRestored: boolean;

  checkoutReady: boolean;

  recoveryReason: RecoveryReason;

  recoveredAt: Date;
}

@Injectable()
export class AbandonedCartStrategy {
  constructor(
    private readonly workflowCache: WorkflowCacheRedisRepository,

    private readonly stateRestorer: RecoveryStateRestorerService,

    private readonly timelineService: WorkflowTimelineService,

    private readonly recoveryTracer: RecoveryTracerService,

    private readonly logger: ProtectionLoggerService,
  ) {}

  // ==================================================
  // ♻️ MAIN RECOVERY ENTRY
  // ==================================================

  async recover(
    input: AbandonedCartInput,
  ): Promise<AbandonedCartResult> {
    const restoredState =
      this.resolveCartState(input);

    const cartRestored =
      this.canRestoreCart(input);

    const checkoutReady = cartRestored;

    // ==================================================
    // 🛰️ TRACE
    // ==================================================

    await this.recoveryTracer.addSpan({
      workflowType: 'checkout',
      operation: 'abandoned_cart_recovery',
      metadata: {
        cartId: input.cartId,
        recoveryReason: input.recoveryReason,
        previousState: input.currentState,
        restoredState,
      },
    });

    // ==================================================
    // ♻️ RESTORE CART STATE
    // ==================================================

    await this.stateRestorer.restore({
      tenantId: input.tenantId,
      userId: input.userId,
      workflowType: 'checkout',
      currentState: input.currentState,
      recoveryReason: input.recoveryReason,
      metadata: {
        cartId: input.cartId,
        recoveryReason: input.recoveryReason,
      },
    });

    // ==================================================
    // 💾 CACHE UPDATE
    // ==================================================

    await this.workflowCache.setWorkflowState(
      `${input.tenantId}:${input.userId}:checkout`,
      {
        traceId: Date.now().toString(),
        tenantId: input.tenantId,
        userId: input.userId,
        type: 'SESSION',
        state: restoredState,
        payload: {
        cartId: input.cartId,
        recovered: true,
        cartRestored,
        checkoutReady,
      },
    });

    // ==================================================
    // 📝 TIMELINE EVENT
    // ==================================================

    await this.timelineService.recordEvent({
      tenantId: input.tenantId,
      userId: input.userId,
      workflowType: 'checkout',
      event: 'ABANDONED_CART_RESTORED',
      state: restoredState,
      metadata: {
        cartId: input.cartId,
        previousState: input.currentState,
        restoredState,
        recoveryReason: input.recoveryReason,
      },
    });

    // ==================================================
    // 🧾 LOGGING
    // ==================================================

    this.logger.warn('AbandonedCartStrategy',
      'ABANDONED_CART_RECOVERED',
      {
        tenantId: input.tenantId,
        userId: input.userId,
        metadata: {
          cartId: input.cartId,
          restoredState,
          cartRestored,
        },
      },
    );

    return {
      recovered: true,
      previousState: input.currentState,
      restoredState,
      workflowStatus: WorkflowStatus.RECOVERED,
      protectionLevel: ProtectionLevel.WARNING,
      cartRestored,
      checkoutReady,
      recoveryReason: input.recoveryReason,
      recoveredAt: new Date(),
    };
  }

  // ==================================================
  // 🧠 CART STATE RESOLUTION
  // ==================================================

  private resolveCartState(
    input: AbandonedCartInput,
  ): string {
    switch (input.recoveryReason) {
      case RecoveryReason.ABANDONED:
        return 'CART_RESTORED';

      case RecoveryReason.TIMEOUT:
        return 'CART_RESUMED';

      case RecoveryReason.RECONNECT:
        return 'CHECKOUT_READY';

      case RecoveryReason.DUPLICATE_MESSAGE:
        return 'CART_CONTINUED';

      default:
        return 'CART_RESTORED';
    }
  }

  // ==================================================
  // 🛒 CART VALIDATION
  // ==================================================

  private canRestoreCart(
    input: AbandonedCartInput,
  ): boolean {
    if (!input.cartId) return false;

    if (input.cartItemsCount === 0) return false;

    if (
      input.lastActivityAt &&
      Date.now() -
        new Date(input.lastActivityAt).getTime() >
        1000 * 60 * 60 * 24 * 7 // 7 days
    ) {
      return false;
    }

    return true;
  }
}