// FILE: src/modules/follow-up-engine/application/triggers/abandonment-follow-up.trigger.ts

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { FollowUpType } from '../../domain/enums/follow-up-type.enum';

import { FollowUpOrchestratorService } from '../services/follow-up-orchestrator.service';

import { FollowUpTriggerVO } from '../../domain/value-objects/follow-up-trigger.vo';

/**
 * AbandonmentFollowUpTrigger
 * -------------------------------------------------------
 * LISTENS FOR ABANDONED WORKFLOWS.
 *
 * Responsibilities:
 * - create abandoned cart reminders
 * - create checkout recovery reminders
 * - bridge protection engine → follow-up engine
 *
 * Trigger Source:
 * - WORKFLOW_ABANDONED
 */

interface WorkflowAbandonedEvent {
  tenantId: string;
  userId: string;

  workflowType:
    | 'conversation'
    | 'session'
    | 'checkout'
    | 'payment'
    | 'order';

  currentState?: string;

  metadata?: Record<string, any>;
}

@Injectable()
export class AbandonmentFollowUpTrigger {
  private readonly logger =
    new Logger(
      AbandonmentFollowUpTrigger.name,
    );

  constructor(
    private readonly orchestrator: FollowUpOrchestratorService,
  ) {}

  // ==================================================
  // 🚨 WORKFLOW ABANDONED
  // ==================================================

  @OnEvent('WORKFLOW_ABANDONED')
  async handleWorkflowAbandoned(
    payload: WorkflowAbandonedEvent,
  ) {
    this.logger.warn(
      `[FOLLOW_UP_TRIGGER] abandoned workflow detected user=${payload.userId} type=${payload.workflowType}`,
    );

    // ==================================================
    // 🛒 CHECKOUT ABANDONMENT
    // ==================================================

    if (
      payload.workflowType ===
      'checkout'
    ) {
      // ----------------------------------------------
      // ABANDONED CART FOLLOW-UP
      // ----------------------------------------------

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
                  'WORKFLOW_ABANDONED',

                source:
                  'protection-engine',

                reason:
                  'checkout_abandoned',

                metadata:
                  payload.metadata,
              },
            ),

          metadata: {
            workflowType:
              payload.workflowType,

            currentState:
              payload.currentState,
          },
        },
      );

      // ----------------------------------------------
      // CHECKOUT RESUME FOLLOW-UP
      // ----------------------------------------------

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
                  'WORKFLOW_ABANDONED',

                source:
                  'protection-engine',

                reason:
                  'checkout_resume',

                metadata:
                  payload.metadata,
              },
            ),

          metadata: {
            workflowType:
              payload.workflowType,

            currentState:
              payload.currentState,
          },
        },
      );

      return;
    }

    // ==================================================
    // 💬 CONVERSATION ABANDONMENT
    // ==================================================

    if (
      payload.workflowType ===
      'conversation'
    ) {
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
                trigger:
                  'WORKFLOW_ABANDONED',

                source:
                  'protection-engine',

                reason:
                  'conversation_idle',

                metadata:
                  payload.metadata,
              },
            ),

          metadata: {
            workflowType:
              payload.workflowType,

            currentState:
              payload.currentState,
          },
        },
      );
    }
  }
}