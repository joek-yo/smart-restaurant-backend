// FILE: src/modules/conversation/application/event-handlers/payment-failed.handler.ts

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventBus } from '@core/events/event.bus';
import { PAYMENT_EVENTS } from '@core/events/event.constants';
import { ConversationRedisRepository } from '../../infrastructure/redis/conversation.redis.repository';
import { ConversationState } from '../../domain/enums/conversation-state.enum';

/**
 * Listens for payment.failed → marks recovery, moves to ORDER_FAILED.
 * Enables AI to resume conversation with context about what failed.
 */
@Injectable()
export class ConversationPaymentFailedHandler implements OnModuleInit {
  private readonly logger = new Logger(ConversationPaymentFailedHandler.name);

  constructor(
    private readonly eventBus: EventBus,
    private readonly repo: ConversationRedisRepository,
  ) {}

  onModuleInit() {
    this.eventBus.on(PAYMENT_EVENTS.PAYMENT_FAILED, this.handle.bind(this));
  }

  async handle(payload: {
    tenantId: string;
    userId: string;
    paymentId: string;
    reason?: string;
  }) {
    this.logger.warn(
      `[PaymentFailed] tenant=${payload.tenantId} user=${payload.userId} reason=${payload.reason}`,
    );

    const ctx = await this.repo.getContext(payload.tenantId, payload.userId);
    if (!ctx) return;

    ctx.markRecovery(ctx.state, `PAYMENT_FAILED: ${payload.reason ?? 'unknown'}`);
    ctx.updateState(ConversationState.ORDER_FAILED);
    ctx.setMemory('failedPaymentId', payload.paymentId);
    ctx.setMemory('paymentFailureReason', payload.reason ?? 'unknown');
    ctx.setPendingPrompt({
      type: 'PAYMENT_RETRY_PROMPT',
      payload: { paymentId: payload.paymentId, reason: payload.reason },
    });

    await this.repo.saveContext(ctx);
    this.logger.log(`[PaymentFailed] Context → ORDER_FAILED with recovery marker`);
  }
}
