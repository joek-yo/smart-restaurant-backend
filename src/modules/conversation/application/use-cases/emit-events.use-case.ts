// src/modules/conversation/application/use-cases/emit-events.use-case.ts
import { Injectable } from '@nestjs/common';
import { EventBus } from '@core/events/event.bus';
import { CONVERSATION_EVENTS } from '@core/events/event.constants';

// States where no side-effect events should ever fire
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
    const events: string[] = [];

    // 🔒 Never emit side effects from locked states
    if (LOCKED_STATES.includes(context.state)) {
      return events;
    }

    const stateChanged = context.state !== transition.nextState;

    if (intent === 'ADD_TO_CART') {
      this.eventBus.emit(CONVERSATION_EVENTS.CART_UPDATED, {
        tenantId: dto.tenantId,
        userId: dto.userId,
        cart: context.cart,
      });
      events.push(CONVERSATION_EVENTS.CART_UPDATED);
    }

    if (intent === 'CHECKOUT' && stateChanged) {
      this.eventBus.emit(CONVERSATION_EVENTS.CHECKOUT_STARTED, {
        tenantId: dto.tenantId,
        userId: dto.userId,
      });
      events.push(CONVERSATION_EVENTS.CHECKOUT_STARTED);
    }

    if (intent === 'CONFIRM_ORDER' && stateChanged && transition.nextState === 'PAYMENT_PENDING') {
      this.eventBus.emit(CONVERSATION_EVENTS.ORDER_REQUESTED, {
        tenantId: dto.tenantId,
        userId: dto.userId,
        cart: context.cart,
      });
      events.push(CONVERSATION_EVENTS.ORDER_REQUESTED);
    }

    return events;
  }
}
