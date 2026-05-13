// FILE: src/modules/conversation/application/event-handlers/checkout-confirmed.handler.ts

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventBus } from '@core/events/event.bus';
import { CHECKOUT_EVENTS } from '@core/events/event.constants';
import { ConversationRedisRepository } from '../../infrastructure/redis/conversation.redis.repository';
import { ConversationState } from '../../domain/enums/conversation-state.enum';

/**
 * Listens for checkout.confirmed → moves conversation to PAYMENT_PENDING.
 * Stores checkout reference so AI knows payment is in-flight.
 */
@Injectable()
export class ConversationCheckoutConfirmedHandler implements OnModuleInit {
  private readonly logger = new Logger(ConversationCheckoutConfirmedHandler.name);

  constructor(
    private readonly eventBus: EventBus,
    private readonly repo: ConversationRedisRepository,
  ) {}

  onModuleInit() {
    this.eventBus.on(CHECKOUT_EVENTS.CHECKOUT_CONFIRMED, this.handle.bind(this));
  }

  async handle(payload: {
    tenantId: string;
    userId: string;
    sessionId?: string;
    total?: number;
  }) {
    this.logger.log(
      `[CheckoutConfirmed] tenant=${payload.tenantId} user=${payload.userId}`,
    );

    const ctx = await this.repo.getContext(payload.tenantId, payload.userId);
    if (!ctx) return;

    ctx.updateState(ConversationState.PAYMENT_PENDING);
    ctx.setMemory('checkoutConfirmedAt', new Date().toISOString());
    ctx.setMemory('checkoutTotal', payload.total);
    ctx.clearRecovery();

    await this.repo.saveContext(ctx);
    this.logger.log(`[CheckoutConfirmed] Context → PAYMENT_PENDING`);
  }
}
