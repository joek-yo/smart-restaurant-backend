// FILE: src/modules/conversation/application/event-handlers/payment-confirmed.handler.ts

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventBus } from '@core/events/event.bus';
import { PAYMENT_EVENTS } from '@core/events/event.constants';
import { ConversationRedisRepository } from '../../infrastructure/redis/conversation.redis.repository';
import { ConversationState } from '../../domain/enums/conversation-state.enum';

/**
 * Listens for payment.confirmed → moves conversation to ORDER_CONFIRMED.
 * Stores payment reference in memory for AI context continuity.
 */
@Injectable()
export class ConversationPaymentConfirmedHandler implements OnModuleInit {
  private readonly logger = new Logger(ConversationPaymentConfirmedHandler.name);

  constructor(
    private readonly eventBus: EventBus,
    private readonly repo: ConversationRedisRepository,
  ) {}

  onModuleInit() {
    this.eventBus.on(PAYMENT_EVENTS.PAYMENT_CONFIRMED, this.handle.bind(this));
  }

  async handle(payload: {
    tenantId: string;
    userId: string;
    orderId: string;
    paymentId: string;
    amount: number;
  }) {
    this.logger.log(
      `[PaymentConfirmed] tenant=${payload.tenantId} user=${payload.userId} order=${payload.orderId}`,
    );

    const ctx = await this.repo.getContext(payload.tenantId, payload.userId);
    if (!ctx) {
      this.logger.warn(`[PaymentConfirmed] No context found — skipping`);
      return;
    }

    ctx.updateState(ConversationState.ORDER_CONFIRMED);
    ctx.setMemory('lastPaymentId', payload.paymentId);
    ctx.setMemory('lastOrderId', payload.orderId);
    ctx.setMemory('lastPaymentAmount', payload.amount);
    ctx.setMemory('lastPaymentAt', new Date().toISOString());
    ctx.clearRecovery();
    ctx.extendTtl(120); // extend session 2h after payment

    await this.repo.saveContext(ctx);
    this.logger.log(`[PaymentConfirmed] Context → ORDER_CONFIRMED`);
  }
}
