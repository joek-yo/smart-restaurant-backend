// src/modules/conversation/application/use-cases/emit-events.use-case.ts

import { Injectable } from '@nestjs/common';
import { EventBus } from '@core/events/event.bus';
import { CONVERSATION_EVENTS } from '@core/events/event.constants';

/**
 * EmitEventsUseCase
 * ------------------
 * PURE INTERACTION LAYER ONLY
 *
 * ❌ MUST NOT emit:
 * - order.*
 * - checkout.*
 * - business logic events
 *
 * ✅ ONLY emits:
 * - conversation.*
 * - intent/state signals
 */

const LOCKED_STATES = ['PAYMENT_PENDING', 'ORDER_CONFIRMED'];

@Injectable()
export class EmitEventsUseCase {
  constructor(private readonly eventBus: EventBus) {}

  async execute({
    dto,
    intent,
    transition,
    context,
  }: {
    dto: any;
    intent: string;
    transition: { nextState: string };
    context: any;
  }): Promise<string[]> {
    const emitted: string[] = [];

    // ─────────────────────────────────────────────
    // 🔒 HARD GUARD — no events in locked states
    // ─────────────────────────────────────────────
    if (LOCKED_STATES.includes(context.state)) {
      return emitted;
    }

    const stateChanged = context.state !== transition.nextState;

    // ─────────────────────────────────────────────
    // 🛒 CART UPDATED (conversation-level only)
    // ─────────────────────────────────────────────
    if (intent === 'ADD_TO_CART') {
      const event = CONVERSATION_EVENTS.CART_UPDATED;

      this.eventBus.emit(event, {
        tenantId: dto.tenantId,
        userId: dto.userId,
        cartSize: context.cart?.length ?? 0,
      });

      emitted.push(event);
    }

    // ─────────────────────────────────────────────
    // 🚀 CHECKOUT INTENT (signal only, NOT business logic)
    // ─────────────────────────────────────────────
    if (intent === 'CHECKOUT' && stateChanged) {
      const event = CONVERSATION_EVENTS.CHECKOUT_STARTED;

      this.eventBus.emit(event, {
        tenantId: dto.tenantId,
        userId: dto.userId,
        source: 'conversation',
      });

      emitted.push(event);
    }

    // ─────────────────────────────────────────────
    // 💳 ORDER REQUEST SIGNAL (NO ORDER CREATION HERE)
    // ─────────────────────────────────────────────
    if (
      intent === 'CONFIRM_ORDER' &&
      stateChanged &&
      transition.nextState === 'PAYMENT_PENDING'
    ) {
      const event = CONVERSATION_EVENTS.ORDER_REQUESTED;

      this.eventBus.emit(event, {
        tenantId: dto.tenantId,
        userId: dto.userId,
        source: 'conversation',
        cartSize: context.cart?.length ?? 0,
      });

      emitted.push(event);
    }

    return emitted;
  }
}