// FILE: src/modules/conversation/application/event-handlers/conversation-timeout.handler.ts

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventBus } from '@core/events/event.bus';
import { CONVERSATION_EVENTS } from '@core/events/event.constants';
import { ConversationRedisRepository } from '../../infrastructure/redis/conversation.redis.repository';
import { ConversationState } from '../../domain/enums/conversation-state.enum';

/**
 * Listens for conversation timeout signals → marks context as ABANDONED.
 * Sets recovery marker so the next message can resume with context.
 */
@Injectable()
export class ConversationTimeoutHandler implements OnModuleInit {
  private readonly logger = new Logger(ConversationTimeoutHandler.name);

  constructor(
    private readonly eventBus: EventBus,
    private readonly repo: ConversationRedisRepository,
  ) {}

  onModuleInit() {
    this.eventBus.on(CONVERSATION_EVENTS.STATE_CHANGED, this.handle.bind(this));
  }

  async handle(payload: {
    tenantId: string;
    userId: string;
    fromState?: string;
    toState?: string;
    reason?: string;
  }) {
    if (payload.toState !== 'ABANDONED' && payload.reason !== 'TIMEOUT') return;

    this.logger.warn(
      `[ConversationTimeout] tenant=${payload.tenantId} user=${payload.userId}`,
    );

    const ctx = await this.repo.getContext(payload.tenantId, payload.userId);
    if (!ctx) return;

    ctx.markRecovery(ctx.state, 'CONVERSATION_TIMEOUT');
    ctx.updateState(ConversationState.ABANDONED);
    await this.repo.markAbandoned(payload.tenantId, payload.userId);

    await this.repo.saveContext(ctx);
    this.logger.log(`[ConversationTimeout] Context → ABANDONED with recovery marker`);
  }
}
