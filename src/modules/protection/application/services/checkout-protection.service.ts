// FILE: src/modules/protection/application/services/checkout-protection.service.ts

import { Injectable, Logger } from '@nestjs/common';

import { WorkflowAnomalyType } from '../../domain/enums/workflow-anomaly-type.enum';
import { ProtectionLevel } from '../../domain/enums/protection-level.enum';
import { WorkflowAnomalyEntity } from '../../domain/entities/workflow-anomaly.entity';

/**
 * CheckoutProtectionService
 * -------------------------
 * Enforces correctness of checkout workflows before:
 * - confirmation
 * - payment transition
 * - order creation handoff
 *
 * This service is a READ-ONLY SAFETY LAYER.
 * It does NOT mutate checkout state.
 */
@Injectable()
export class CheckoutProtectionService {
  private readonly logger = new Logger(CheckoutProtectionService.name);

  // ==================================================
  // 🔒 VALIDATE CHECKOUT READINESS
  // ==================================================
  validateCheckoutReadiness(input: {
    checkoutId: string;
    userId: string;
    tenantId: string;
    itemsCount: number;
    state: string;
    hasPaymentMethod?: boolean;
  }): WorkflowAnomalyEntity | null {
    if (input.itemsCount <= 0) {
      this.logger.warn(
        `[PROTECTION] empty checkout detected checkout=${input.checkoutId}`,
      );

      return new WorkflowAnomalyEntity(
        `${input.checkoutId}:EMPTY_CHECKOUT`,
        input.tenantId,
        input.checkoutId,
        WorkflowAnomalyType.STATE_CORRUPTION,
        ProtectionLevel.CRITICAL,
        {
          reason: 'EMPTY_ITEMS',
          userId: input.userId,
        },
      );
    }

    if (input.state === 'PAYMENT_PENDING' && !input.hasPaymentMethod) {
      this.logger.warn(
        `[PROTECTION] missing payment method checkout=${input.checkoutId}`,
      );

      return new WorkflowAnomalyEntity(
        `${input.checkoutId}:MISSING_PAYMENT`,
        input.tenantId,
        input.checkoutId,
        WorkflowAnomalyType.INVALID_TRANSITION,
        ProtectionLevel.CRITICAL,
        {
          state: input.state,
          userId: input.userId,
        },
      );
    }

    return null;
  }

  // ==================================================
  // 🔁 VALIDATE SAFE CHECKOUT TRANSITIONS
  // ==================================================
  validateTransition(input: {
    from: string;
    to: string;
    checkoutId: string;
    userId: string;
    tenantId: string;
  }): WorkflowAnomalyEntity | null {
    const allowed: Record<string, string[]> = {
      CREATED: ['VALIDATED', 'CANCELLED'],
      VALIDATED: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PAYMENT_PENDING'],
      PAYMENT_PENDING: ['ORDER_CREATED', 'FAILED'],
      ORDER_CREATED: [],
      FAILED: [],
      CANCELLED: [],
    };

    const allowedNext = allowed[input.from] ?? [];

    if (!allowedNext.includes(input.to)) {
      this.logger.error(
        `[PROTECTION] invalid checkout transition ${input.from} → ${input.to}`,
      );

      return new WorkflowAnomalyEntity(
        `${input.checkoutId}:INVALID_CHECKOUT_TRANSITION`,
        input.tenantId,
        input.checkoutId,
        WorkflowAnomalyType.INVALID_TRANSITION,
        ProtectionLevel.CRITICAL,
        {
          from: input.from,
          to: input.to,
          userId: input.userId,
        },
      );
    }

    return null;
  }

  // ==================================================
  // 🚨 DETECT STALE CHECKOUTS
  // ==================================================
  detectStaleCheckout(input: {
    checkoutId: string;
    lastUpdatedAt: Date;
    thresholdMs: number;
  }): WorkflowAnomalyEntity | null {
    const now = Date.now();
    const last = input.lastUpdatedAt.getTime();

    if (now - last > input.thresholdMs) {
      this.logger.warn(
        `[PROTECTION] stale checkout detected checkout=${input.checkoutId}`,
      );

      return new WorkflowAnomalyEntity(
        `${input.checkoutId}:STALE`,
        'SYSTEM',
        input.checkoutId,
        WorkflowAnomalyType.STALE_WORKFLOW,
        ProtectionLevel.WARNING,
        {
          lastUpdatedAt: input.lastUpdatedAt,
          thresholdMs: input.thresholdMs,
        },
      );
    }

    return null;
  }

  // ==================================================
  // 🧠 CHECK IF CHECKOUT IS RECOVERABLE
  // ==================================================
  isRecoverable(input: {
    state: string;
    itemsCount: number;
  }): boolean {
    const terminalStates = ['ORDER_CREATED', 'CANCELLED'];

    if (terminalStates.includes(input.state)) {
      return false;
    }

    if (input.itemsCount <= 0) {
      return false;
    }

    return true;
  }
}