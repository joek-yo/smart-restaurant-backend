// FILE: src/modules/conversation/application/event-handlers/order-completed.handler.ts

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventBus } from '@core/events/event.bus';
import { ORDER_EVENTS } from '@core/events/event.constants';
import { ConversationRedisRepository } from '../../infrastructure/redis/conversation.redis.repository';
import { ConversationState } from '../../domain/enums/conversation-state.enum';

/**
 * Listens for order.completed → moves conversation to COMPLETED.
 * Clears pending prompts and recovery markers — clean terminal state.
 */
@Injectable()
export class ConversationOrderCompletedHandler implements OnModuleInit {
  private readonly logger = new Logger(ConversationOrderCompletedHandler.name);

  constructor(
    private readonly eventBus: EventBus,
    private readonly repo: ConversationRedisRepository,
  ) {}

  onModuleInit() {
    this.eventBus.on(ORDER_EVENTS.ORDER_COMPLETED, this.handle.bind(this));
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

    if (!tenantId || !userId) return;

    this.logger.log(`[OrderCompleted] tenant=${tenantId} user=${userId} order=${payload.orderId}`);

    const ctx = await this.repo.getContext(tenantId, userId);
    if (!ctx) return;

    ctx.updateState(ConversationState.COMPLETED);
    ctx.clearPendingPrompt();
    ctx.clearRecovery();
    ctx.setMemory('completedOrderId', payload.orderId);
    ctx.setMemory('completedAt', new Date().toISOString());

    await this.repo.saveContext(ctx);
    this.logger.log(`[OrderCompleted] Context → COMPLETED`);
  }
}
