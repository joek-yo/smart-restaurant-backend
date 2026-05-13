// FILE: src/modules/conversation/application/event-handlers/order-created.handler.ts

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventBus } from '@core/events/event.bus';
import { ORDER_EVENTS } from '@core/events/event.constants';
import { ConversationRedisRepository } from '../../infrastructure/redis/conversation.redis.repository';
import { ConversationState } from '../../domain/enums/conversation-state.enum';

/**
 * Listens for order.created → records orderId in conversation memory.
 * Allows AI to reference the order naturally in follow-up messages.
 */
@Injectable()
export class ConversationOrderCreatedHandler implements OnModuleInit {
  private readonly logger = new Logger(ConversationOrderCreatedHandler.name);

  constructor(
    private readonly eventBus: EventBus,
    private readonly repo: ConversationRedisRepository,
  ) {}

  onModuleInit() {
    this.eventBus.on(ORDER_EVENTS.ORDER_CREATED, this.handle.bind(this));
  }

  async handle(payload: {
    tenantId?: string;
    businessId?: string;
    customerId?: string;
    userId?: string;
    orderId: string;
  }) {
    const tenantId = payload.tenantId ?? payload.businessId;
    const userId = payload.userId ?? payload.customerId;

    if (!tenantId || !userId) {
      this.logger.warn(`[OrderCreated] Missing tenantId or userId — skipping`);
      return;
    }

    this.logger.log(`[OrderCreated] tenant=${tenantId} user=${userId} order=${payload.orderId}`);

    const ctx = await this.repo.getContext(tenantId, userId);
    if (!ctx) return;

    ctx.setMemory('currentOrderId', payload.orderId);
    ctx.setMemory('orderCreatedAt', new Date().toISOString());
    ctx.updateState(ConversationState.ORDER_CONFIRMED);

    await this.repo.saveContext(ctx);
    this.logger.log(`[OrderCreated] Context → ORDER_CONFIRMED`);
  }
}
