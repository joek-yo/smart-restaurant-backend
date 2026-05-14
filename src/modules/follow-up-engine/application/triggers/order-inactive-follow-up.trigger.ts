// FILE: src/modules/follow-up-engine/application/triggers/order-inactive-follow-up.trigger.ts

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { FollowUpType } from '../../domain/enums/follow-up-type.enum';

import { FollowUpOrchestratorService } from '../services/follow-up-orchestrator.service';

import { FollowUpTriggerVO } from '../../domain/value-objects/follow-up-trigger.vo';

/**
 * OrderInactiveFollowUpTrigger
 * -------------------------------------------------------
 * LISTENS FOR INACTIVE ORDERS.
 *
 * Responsibilities:
 * - detect stalled or pending orders
 * - send order reminders
 * - re-engage customers before drop-off
 *
 * Trigger Source:
 * - ORDER_INACTIVE (derived from order engine / protection engine)
 */

interface OrderInactiveEvent {
  tenantId: string;
  userId: string;

  orderId: string;

  currentState?: string;

  inactivityDurationMs?: number;

  metadata?: Record<string, any>;
}

@Injectable()
export class OrderInactiveFollowUpTrigger {
  private readonly logger = new Logger(
    OrderInactiveFollowUpTrigger.name,
  );

  constructor(
    private readonly orchestrator: FollowUpOrchestratorService,
  ) {}

  // ==================================================
  // 📦 ORDER INACTIVE
  // ==================================================

  @OnEvent('ORDER_INACTIVE')
  async handleOrderInactive(
    payload: OrderInactiveEvent,
  ) {
    this.logger.warn(
      `[FOLLOW_UP_TRIGGER] order inactive user=${payload.userId} order=${payload.orderId}`,
    );

    // ==================================================
    // 📦 ORDER REMINDER FOLLOW-UP
    // ==================================================

    await this.orchestrator.createFollowUp(
      {
        tenantId:
          payload.tenantId,

        userId:
          payload.userId,

        type:
          FollowUpType.ORDER_REMINDER,

        channel:
          'whatsapp',

        trigger:
          FollowUpTriggerVO.create(
            {
              type: 'ORDER_INACTIVE',
              trigger:
                'ORDER_INACTIVE',

              source:
                'order-engine',

              reason:
                'order_pending_inactive',

              metadata:
                payload.metadata,
            },
          ),

        metadata: {
          orderId:
            payload.orderId,

          currentState:
            payload.currentState,

          inactivityDurationMs:
            payload.inactivityDurationMs,
        },
      },
    );

    // ==================================================
    // 🔄 REACTIVATION FOLLOW-UP (SOFT PUSH)
    // ==================================================

    await this.orchestrator.createFollowUp(
      {
        tenantId:
          payload.tenantId,

        userId:
          payload.userId,

        type:
          FollowUpType.REACTIVATION,

        channel:
          'whatsapp',

        trigger:
          FollowUpTriggerVO.create(
            {
              type: 'ORDER_INACTIVE',
              trigger:
                'ORDER_INACTIVE',

              source:
                'order-engine',

              reason:
                'order_reactivation_nudge',

              metadata:
                payload.metadata,
            },
          ),

        metadata: {
          orderId:
            payload.orderId,

          currentState:
            payload.currentState,

          inactivityDurationMs:
            payload.inactivityDurationMs,
        },
      },
    );
  }
}