// FILE: src/modules/follow-up-engine/application/triggers/payment-failed-follow-up.trigger.ts

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { FollowUpType } from '../../domain/enums/follow-up-type.enum';

import { FollowUpOrchestratorService } from '../services/follow-up-orchestrator.service';

import { FollowUpTriggerVO } from '../../domain/value-objects/follow-up-trigger.vo';

/**
 * PaymentFailedFollowUpTrigger
 * -------------------------------------------------------
 * LISTENS FOR PAYMENT FAILURES.
 *
 * Responsibilities:
 * - create payment retry reminders
 * - create checkout recovery reminders
 * - recover failed payment flows
 *
 * Trigger Source:
 * - PAYMENT_FAILED
 */

interface PaymentFailedEvent {
  tenantId: string;
  userId: string;

  paymentId: string;

  orderId?: string;

  amount?: number;

  currency?: string;

  reason?: string;

  retryUrl?: string;

  metadata?: Record<string, any>;
}

@Injectable()
export class PaymentFailedFollowUpTrigger {
  private readonly logger =
    new Logger(
      PaymentFailedFollowUpTrigger.name,
    );

  constructor(
    private readonly orchestrator: FollowUpOrchestratorService,
  ) {}

  // ==================================================
  // 💳 PAYMENT FAILED
  // ==================================================

  @OnEvent('PAYMENT_FAILED')
  async handlePaymentFailed(
    payload: PaymentFailedEvent,
  ) {
    this.logger.warn(
      `[FOLLOW_UP_TRIGGER] payment failed user=${payload.userId} payment=${payload.paymentId}`,
    );

    // ==================================================
    // 💳 PAYMENT RETRY FOLLOW-UP
    // ==================================================

    await this.orchestrator.createFollowUp(
      {
        tenantId:
          payload.tenantId,

        userId:
          payload.userId,

        type:
          FollowUpType.PAYMENT_RETRY,

        channel:
          'whatsapp',

        trigger:
          FollowUpTriggerVO.create(
            {
              trigger:
                'PAYMENT_FAILED',

              source:
                'payment-engine',

              reason:
                payload.reason ??
                'payment_failed',

              metadata:
                payload.metadata,
            },
          ),

        payment: {
          paymentId:
            payload.paymentId,

          amount:
            payload.amount,

          currency:
            payload.currency,

          failureReason:
            payload.reason,

          retryUrl:
            payload.retryUrl,
        },

        metadata: {
          orderId:
            payload.orderId,

          paymentId:
            payload.paymentId,
        },
      },
    );

    // ==================================================
    // 🛒 CHECKOUT RESUME FOLLOW-UP
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
                'PAYMENT_FAILED',

              source:
                'payment-engine',

              reason:
                'checkout_resume_after_payment_failure',

              metadata:
                payload.metadata,
            },
          ),

        payment: {
          paymentId:
            payload.paymentId,

          amount:
            payload.amount,

          currency:
            payload.currency,

          failureReason:
            payload.reason,

          retryUrl:
            payload.retryUrl,
        },

        metadata: {
          orderId:
            payload.orderId,

          paymentId:
            payload.paymentId,
        },
      },
    );
  }
}