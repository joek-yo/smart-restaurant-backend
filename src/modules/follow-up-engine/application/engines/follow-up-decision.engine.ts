// FILE: src/modules/follow-up-engine/application/engines/follow-up-decision.engine.ts

import { Injectable } from '@nestjs/common';

import { FollowUpType } from '../../domain/enums/follow-up-type.enum';

import { FollowUpRepository } from '../../domain/repositories/follow-up.repository';

import { FollowUpLoggerService } from '../../infrastructure/observability/follow-up-logger.service';

/**
 * FollowUpDecisionEngine
 * -------------------------------------------------------
 * INTELLIGENCE LAYER.
 *
 * Responsibilities:
 * - decide IF follow-up should exist
 * - prevent duplicate follow-ups
 * - prevent spam
 * - avoid invalid recovery attempts
 * - enforce recovery safety
 *
 * IMPORTANT:
 * This engine NEVER schedules.
 * It ONLY decides.
 */

export interface FollowUpDecisionInput {
  tenantId: string;

  userId: string;

  workflowType:
    | 'conversation'
    | 'session'
    | 'checkout'
    | 'payment'
    | 'order';

  followUpType: FollowUpType;

  workflowState?: string;

  userRecovered?: boolean;

  paymentCompleted?: boolean;

  orderCompleted?: boolean;

  optedOut?: boolean;

  metadata?: Record<string, any>;
}

export interface FollowUpDecisionResult {
  allowed: boolean;

  reason:
    | 'APPROVED'
    | 'USER_RECOVERED'
    | 'PAYMENT_COMPLETED'
    | 'ORDER_COMPLETED'
    | 'USER_OPTED_OUT'
    | 'ACTIVE_FOLLOW_UP_EXISTS'
    | 'INVALID_WORKFLOW_STATE';
}

@Injectable()
export class FollowUpDecisionEngine {
  constructor(
    private readonly repository: FollowUpRepository,

    private readonly logger: FollowUpLoggerService,
  ) {}

  // ==================================================
  // 🚦 MAIN DECISION ENTRY
  // ==================================================

  async decide(
    input: FollowUpDecisionInput,
  ): Promise<FollowUpDecisionResult> {
    // ==================================================
    // 🚫 USER OPTED OUT
    // ==================================================

    if (input.optedOut) {
      return this.reject(
        input,
        'USER_OPTED_OUT',
      );
    }

    // ==================================================
    // ♻️ USER ALREADY RECOVERED
    // ==================================================

    if (input.userRecovered) {
      return this.reject(
        input,
        'USER_RECOVERED',
      );
    }

    // ==================================================
    // 💳 PAYMENT COMPLETED
    // ==================================================

    if (input.paymentCompleted) {
      return this.reject(
        input,
        'PAYMENT_COMPLETED',
      );
    }

    // ==================================================
    // 📦 ORDER COMPLETED
    // ==================================================

    if (input.orderCompleted) {
      return this.reject(
        input,
        'ORDER_COMPLETED',
      );
    }

    // ==================================================
    // 🔁 DUPLICATE ACTIVE FOLLOW-UP
    // ==================================================

    const activeExists =
      await this.repository.existsActiveFollowUp(
        input.tenantId,
        input.userId,
        input.followUpType,
      );

    if (activeExists) {
      return this.reject(
        input,
        'ACTIVE_FOLLOW_UP_EXISTS',
      );
    }

    // ==================================================
    // 🧠 WORKFLOW VALIDATION
    // ==================================================

    const validWorkflow =
      this.validateWorkflowState(
        input,
      );

    if (!validWorkflow) {
      return this.reject(
        input,
        'INVALID_WORKFLOW_STATE',
      );
    }

    // ==================================================
    // ✅ APPROVED
    // ==================================================

    this.logger.info(
      'FollowUpDecisionEngine',
      'FOLLOW_UP_APPROVED',
      {
        tenantId: input.tenantId,
        userId: input.userId,
        workflowType:
          input.workflowType,
        followUpType:
          input.followUpType,
      },
    );

    return {
      allowed: true,
      reason: 'APPROVED',
    };
  }

  // ==================================================
  // 🧠 WORKFLOW VALIDATION
  // ==================================================

  private validateWorkflowState(
    input: FollowUpDecisionInput,
  ): boolean {
    switch (input.followUpType) {
      // ----------------------------------------------
      // 🛒 ABANDONED CART
      // ----------------------------------------------

      case FollowUpType.ABANDONED_CART:
        return [
          'ABANDONED',
          'IDLE',
          'CART_ACTIVE',
        ].includes(
          input.workflowState ?? '',
        );

      // ----------------------------------------------
      // 💳 PAYMENT RETRY
      // ----------------------------------------------

      case FollowUpType.PAYMENT_RETRY:
        return [
          'PAYMENT_FAILED',
          'PAYMENT_PENDING',
          'ORDER_FAILED',
        ].includes(
          input.workflowState ?? '',
        );

      // ----------------------------------------------
      // ♻️ CHECKOUT RESUME
      // ----------------------------------------------

      case FollowUpType.CHECKOUT_RESUME:
        return [
          'CHECKOUT',
          'CHECKOUT_STARTED',
          'CHECKOUT_STALLED',
        ].includes(
          input.workflowState ?? '',
        );

      // ----------------------------------------------
      // 📦 ORDER REMINDER
      // ----------------------------------------------

      case FollowUpType.ORDER_REMINDER:
        return [
          'ORDER_PENDING',
          'ORDER_CONFIRMED',
        ].includes(
          input.workflowState ?? '',
        );

      // ----------------------------------------------
      // 🔄 REACTIVATION
      // ----------------------------------------------

      case FollowUpType.REACTIVATION:
        return [
          'INACTIVE',
          'DORMANT',
          'ABANDONED',
        ].includes(
          input.workflowState ?? '',
        );

      default:
        return false;
    }
  }

  // ==================================================
  // ❌ REJECTION FACTORY
  // ==================================================

  private reject(
    input: FollowUpDecisionInput,
    reason: FollowUpDecisionResult['reason'],
  ): FollowUpDecisionResult {
    this.logger.warn(
      'FollowUpDecisionEngine',
      'FOLLOW_UP_REJECTED',
      {
        tenantId: input.tenantId,
        userId: input.userId,
        workflowType:
          input.workflowType,
        followUpType:
          input.followUpType,
        metadata: {
          reason,
        },
      },
    );

    return {
      allowed: false,
      reason,
    };
  }
}