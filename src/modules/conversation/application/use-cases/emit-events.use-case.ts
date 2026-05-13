// src/modules/conversation/application/use-cases/emit-events.use-case.ts

import { Injectable } from '@nestjs/common';
import { EventBus } from '@core/events/event.bus';
import { CONVERSATION_EVENTS } from '@core/events/event.constants';

/**
 * EmitEventsUseCase
 * ------------------
 * PURE CONVERSATION EVENT EMITTER
 *
 * RULE:
 * - ONLY emits conversation-level signals
 * - NEVER triggers business workflows
 */

const LOCKED_STATES = [
  'PAYMENT_PENDING',
  'ORDER_CONFIRMED',
];

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

    // ==================================================
    // 🔒 LOCKED STATES = NO SIDE EFFECTS
    // ==================================================
    if (LOCKED_STATES.includes(context.state)) {
      return emitted;
    }

    const stateChanged = context.state !== transition.nextState;

    // ==================================================
    // 🧠 INTENT SIGNAL (PURE OBSERVABILITY)
    // ==================================================
    const intentEvent = CONVERSATION_EVENTS.INTENT_DETECTED;

    this.eventBus.emit(intentEvent, {
      tenantId: dto.tenantId,
      userId: dto.userId,
      intent,
    });

    emitted.push(intentEvent);

    // ==================================================
    // 💬 MESSAGE PROCESSED SIGNAL
    // ==================================================
    const messageEvent = CONVERSATION_EVENTS.MESSAGE_RECEIVED;

    this.eventBus.emit(messageEvent, {
      tenantId: dto.tenantId,
      userId: dto.userId,
      messageId: dto.messageId,
    });

    emitted.push(messageEvent);

    // ==================================================
    // 🔄 STATE CHANGE SIGNAL
    // ==================================================
    if (stateChanged) {
      const stateEvent = CONVERSATION_EVENTS.STATE_CHANGED;

      this.eventBus.emit(stateEvent, {
        tenantId: dto.tenantId,
        userId: dto.userId,
        from: context.state,
        to: transition.nextState,
      });

      emitted.push(stateEvent);
    }

    // ==================================================
    // 📤 RESPONSE READY SIGNAL
    // ==================================================
    const responseEvent = CONVERSATION_EVENTS.RESPONSE_READY;

    this.eventBus.emit(responseEvent, {
      tenantId: dto.tenantId,
      userId: dto.userId,
    });

    emitted.push(responseEvent);

    return emitted;
  }
}