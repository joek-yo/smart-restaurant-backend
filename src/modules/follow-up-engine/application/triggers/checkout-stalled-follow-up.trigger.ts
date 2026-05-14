// FILE: src/modules/follow-up-engine/application/triggers/checkout-stalled-follow-up.trigger.ts

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { FollowUpType } from '../../domain/enums/follow-up-type.enum';

import { FollowUpOrchestratorService } from '../services/follow-up-orchestrator.service';

import { FollowUpTriggerVO } from '../../domain/value-objects/follow-up-trigger.vo';

/**
 * CheckoutStalledFollowUpTrigger
 * -------------------------------------------------------
 * LISTENS FOR STALLED CHECKOUTS.
 *
 * Responsibilities:
 * - detect checkout inactivity signals
 * - create gentle nudges
 * - prevent silent drop-offs
 *
 * Trigger Source:
 * - CHECKOUT_STALLED (or derived engine signal)
 */

interface CheckoutStalledEvent {
  tenantId: string;
  userId: string;

  checkoutId?: string;

  currentState?: string;

  inactivityDurationMs?: number;

  metadata?: Record<string, any>;
}

@Injectable()
export class CheckoutStalledFollowUpTrigger {
  private readonly logger = new Logger(
    CheckoutStalledFollowUpTrigger.name,
  );

  constructor(
    private readonly orchestrator: FollowUpOrchestratorService,
  ) {}

  // ==================================================
  // 🛒 CHECKOUT STALLED
  // ==================================================

  @OnEvent('CHECKOUT_STALLED')
  async handleCheckoutStalled(
    payload: CheckoutStalledEvent,
  ) {
    this.logger.warn(
      `[FOLLOW_UP_TRIGGER] checkout stalled user=${payload.userId} checkout=${payload.checkoutId}`,
    );

    // ==================================================
    // 🛒 ABANDONMENT NUDGE FOLLOW-UP
    // ==================================================

    await this.orchestrator.createFollowUp(
      {
        tenantId:
          payload.tenantId,

        userId:
          payload.userId,

        type:
          FollowUpType.ABANDONED_CART,

        channel:
          'whatsapp',

        trigger:
          FollowUpTriggerVO.create(
            {
              trigger:
                'CHECKOUT_STALLED',

              source:
                'checkout-engine',

              reason:
                'checkout_inactive',

              metadata:
                payload.metadata,
            },
          ),

        metadata: {
          checkoutId:
            payload.checkoutId,

          currentState:
            payload.currentState,

          inactivityDurationMs:
            payload.inactivityDurationMs,
        },
      },
    );

    // ==================================================
    // 🧾 CHECKOUT RESUME NUDGE
    // ==================================================

    await this.orchestrator.createFollowUp(
      {
        tenantId:
          payload.tenantId,

        userId:
          payload.userId,

        type:
          FollowUpType.CHECKOUT_RESUME,

        channel:
          'whatsapp',

        trigger:
          FollowUpTriggerVO.create(
            {
              trigger:
                'CHECKOUT_STALLED',

              source:
                'checkout-engine',

              reason:
                'checkout_resume_nudge',

              metadata:
                payload.metadata,
            },
          ),

        metadata: {
          checkoutId:
            payload.checkoutId,

          currentState:
            payload.currentState,

          inactivityDurationMs:
            payload.inactivityDurationMs,
        },
      },
    );
  }
}