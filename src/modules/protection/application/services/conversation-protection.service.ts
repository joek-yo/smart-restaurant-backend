// FILE: src/modules/protection/application/services/conversation-protection.service.ts

import { Injectable, Logger } from '@nestjs/common';

import { ConversationState } from '@modules/conversation/domain/enums/conversation-state.enum';
import { WorkflowAnomalyType } from '../../domain/enums/workflow-anomaly-type.enum';
import { ProtectionLevel } from '../../domain/enums/protection-level.enum';
import { WorkflowAnomalyEntity } from '../../domain/entities/workflow-anomaly.entity';

/**
 * ConversationProtectionService
 * -----------------------------
 * Enforces safety rules for conversation state transitions.
 *
 * Responsibilities:
 * - Prevent invalid state jumps
 * - Detect corrupted conversation flows
 * - Flag stale or inconsistent states
 * - Protect against unsafe checkout/payment transitions
 *
 * This service is READ-ONLY by design.
 */
@Injectable()
export class ConversationProtectionService {
  private readonly logger = new Logger(ConversationProtectionService.name);

  // ==================================================
  // 🔒 VALIDATE STATE TRANSITION SAFETY
  // ==================================================
  validateTransition(input: {
    userId: string;
    tenantId: string;
    from: ConversationState;
    to: ConversationState;
    messageId?: string;
  }): WorkflowAnomalyEntity | null {
    const allowedTransitions: Partial<Record<ConversationState, ConversationState[]>> = {
      [ConversationState.IDLE]: [
        ConversationState.BROWSING,
        ConversationState.STARTED,
      ],

      [ConversationState.STARTED]: [
        ConversationState.BROWSING,
      ],

      [ConversationState.BROWSING]: [
        ConversationState.CART_ACTIVE,
        ConversationState.VIEWING_PRODUCT,
      ],

      [ConversationState.VIEWING_PRODUCT]: [
        ConversationState.BROWSING,
        ConversationState.CART_ACTIVE,
      ],

      [ConversationState.CART_ACTIVE]: [
        ConversationState.CART_UPDATED,
        ConversationState.CHECKOUT,
      ],

      [ConversationState.CART_UPDATED]: [
        ConversationState.CHECKOUT,
        ConversationState.BROWSING,
      ],

      [ConversationState.CHECKOUT]: [
        ConversationState.PAYMENT_PENDING,
        ConversationState.ORDER_CONFIRMED,
        ConversationState.CANCELLED,
      ],

      [ConversationState.PAYMENT_PENDING]: [
        ConversationState.ORDER_CONFIRMED,
        ConversationState.ORDER_FAILED,
      ],

      [ConversationState.ORDER_CONFIRMED]: [],
      [ConversationState.ORDER_FAILED]: [],
      [ConversationState.CANCELLED]: [],
      [ConversationState.ERROR]: [],
    };

    const allowed = allowedTransitions[input.from] ?? [];

    if (!allowed.includes(input.to)) {
      this.logger.error(
        `[PROTECTION] invalid conversation transition ${input.from} → ${input.to} user=${input.userId}`,
      );

      return new (WorkflowAnomalyEntity as any)(
        `${input.userId}:INVALID_TRANSITION`,
        input.tenantId,
        input.userId,
        WorkflowAnomalyType.INVALID_TRANSITION,
        ProtectionLevel.CRITICAL,
        {
          from: input.from,
          to: input.to,
          messageId: input.messageId,
        },
      );
    }

    return null;
  }

  // ==================================================
  // 🧠 CHECK FOR CORRUPTED STATES
  // ==================================================
  detectCorruption(input: {
    state: ConversationState;
    hasSession: boolean;
    hasCart: boolean;
  }): WorkflowAnomalyEntity | null {
    const invalid =
      (input.state === ConversationState.CART_ACTIVE && !input.hasSession) ||
      (input.state === ConversationState.CHECKOUT && !input.hasCart);

    if (!invalid) return null;

    this.logger.warn(
      `[PROTECTION] conversation corruption detected state=${input.state}`,
    );

    return new (WorkflowAnomalyEntity as any)(
      `CONVERSATION_CORRUPTION:${Date.now()}`,
      'SYSTEM',
      'conversation',
      WorkflowAnomalyType.STATE_CORRUPTION,
      ProtectionLevel.CRITICAL,
      {
        state: input.state,
        hasSession: input.hasSession,
        hasCart: input.hasCart,
      },
    );
  }

  // ==================================================
  // 🔁 CHECK SAFE CHECKOUT ENTRY
  // ==================================================
  canEnterCheckout(input: {
    state: ConversationState;
    hasItems: boolean;
  }): boolean {
    if (!input.hasItems) return false;

    const allowedStates = [
      ConversationState.CART_ACTIVE,
      ConversationState.CART_UPDATED,
    ];

    return allowedStates.includes(input.state);
  }

  // ==================================================
  // 🚨 DETECT STUCK CONVERSATION
  // ==================================================
  detectStaleConversation(input: {
    state: ConversationState;
    lastUpdatedMs: number;
    thresholdMs: number;
  }): WorkflowAnomalyEntity | null {
    const now = Date.now();

    if (now - input.lastUpdatedMs > input.thresholdMs) {
      return new (WorkflowAnomalyEntity as any)(
        `STALE_CONVERSATION:${input.lastUpdatedMs}`,
        'SYSTEM',
        'conversation',
        WorkflowAnomalyType.STALE_WORKFLOW,
        ProtectionLevel.WARNING,
        {
          state: input.state,
          lastUpdatedMs: input.lastUpdatedMs,
        },
      );
    }

    return null;
  }

  async protect(_input: any): Promise<void> {}

  async validateState(_input: any): Promise<any> { return { valid: true }; }
}
