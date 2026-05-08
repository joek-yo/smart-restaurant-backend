// src/modules/conversation/application/use-cases/process-message.use-case.ts
import { Injectable } from '@nestjs/common';
import { LoadContextUseCase } from './load-context.use-case';
import { ResolveIntentUseCase } from './resolve-intent.use-case';
import { ResolveTransitionUseCase } from './resolve-transition.use-case';
import { EmitEventsUseCase } from './emit-events.use-case';
import { BuildResponseUseCase } from './build-response.use-case';
import { PersistContextUseCase } from './persist-context.use-case';
import { ProcessMessageDTO } from '../dto/process-message.dto';
import { ConversationRedisRepository } from '../../infrastructure/redis/conversation.redis.repository';

@Injectable()
export class ProcessMessageUseCase {
  constructor(
    private readonly loadContext: LoadContextUseCase,
    private readonly resolveIntent: ResolveIntentUseCase,
    private readonly resolveTransition: ResolveTransitionUseCase,
    private readonly emitEvents: EmitEventsUseCase,
    private readonly buildResponse: BuildResponseUseCase,
    private readonly persistContext: PersistContextUseCase,
    private readonly redisRepo: ConversationRedisRepository,
  ) {}

  async execute(dto: ProcessMessageDTO) {
    const { message } = dto;

    // ==================================================
    // 🔐 IDEMPOTENCY CHECK
    // If this messageId was already processed, return
    // cached result immediately — no side effects
    // ==================================================
    const messageId = message.messageId;
    const cached = await this.redisRepo.getProcessedMessage(
      message.tenantId,
      message.userId,
      messageId,
    );

    if (cached) {
      console.log(`[IDEMPOTENCY] Duplicate message detected: ${messageId} — returning cached result`);
      return {
        ...cached,
        idempotent: true,
      };
    }

    // 1. Load context from Redis
    const context = await this.loadContext.execute({
      tenantId: message.tenantId,
      userId: message.userId,
      channel: message.channel,
    });

    // 2. Resolve intent
    const intent = this.resolveIntent.execute(message.content);

    // 3. Resolve state transition
    const transition = this.resolveTransition.execute({
      state: context.state,
      intent,
    });

    // 4. Emit domain events
    const events = await this.emitEvents.execute({
      dto: message,
      intent,
      transition,
      context,
    });

    // 5. Build state-aware response
    const response = this.buildResponse.execute({
      intent,
      transition,
      currentState: context.state,
    });

    // 6. Persist updated context
    await this.persistContext.execute({
      dto: message,
      context,
      transition,
    });

    const result = {
      response,
      events,
      nextState: transition.nextState,
    };

    // ==================================================
    // 🔐 MARK MESSAGE AS PROCESSED
    // Any retry of this messageId returns cached result
    // ==================================================
    await this.redisRepo.markMessageProcessed(
      message.tenantId,
      message.userId,
      messageId,
      result,
    );

    return result;
  }
}
