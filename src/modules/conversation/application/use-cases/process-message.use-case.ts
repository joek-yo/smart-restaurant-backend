// FILE: src/modules/conversation/application/use-cases/process-message.use-case.ts

import { Injectable } from '@nestjs/common';
import { ProcessMessageDTO } from '../dto/process-message.dto';
import { ConversationRedisRepository } from '../../infrastructure/redis/conversation.redis.repository';
import { ConversationOrchestratorService } from '../orchestrators/conversation-orchestrator.service';

export interface ProcessMessageResult {
  response: string;
  state: string;
  intent: string;
  events: string[];
  idempotent?: boolean;
}

@Injectable()
export class ProcessMessageUseCase {
  constructor(
    private readonly orchestrator: ConversationOrchestratorService,
    private readonly redisRepo: ConversationRedisRepository,
  ) {}

  async execute(dto: ProcessMessageDTO): Promise<ProcessMessageResult> {
    const { message } = dto;

    // ── IDEMPOTENCY CHECK ─────────────────────────────────
    const cached = await this.redisRepo.getProcessedMessage(
      message.tenantId,
      message.userId,
      message.messageId,
    );

    if (cached) {
      return {
        response: cached.response,
        state: cached.nextState,
        intent: 'UNKNOWN',
        events: cached.events,
        idempotent: true,
      };
    }

    // ── DELEGATE TO ORCHESTRATOR ──────────────────────────
    const result = await this.orchestrator.execute({
      tenantId: message.tenantId,
      userId: message.userId,
      channel: message.channel,
      message: message.content,
      messageId: message.messageId,
      metadata: message.metadata,
    });

    // ── CACHE RESULT ──────────────────────────────────────
    await this.redisRepo.markMessageProcessed(
      message.tenantId,
      message.userId,
      message.messageId,
      { response: result.response, events: result.events, nextState: result.state },
    );

    return result;
  }
}
