// src/modules/conversation/application/use-cases/load-context.use-case.ts
import { Injectable } from '@nestjs/common';
import { ConversationRedisRepository } from '../../infrastructure/redis/conversation.redis.repository';
import { ConversationContextEntity } from '../../domain/entities/conversation-context.entity';
import { ConversationState } from '../../domain/enums/conversation-state.enum';
import { ConversationChannel } from '../../domain/enums/conversation-channel.enum';

@Injectable()
export class LoadContextUseCase {
  constructor(
    private readonly redisRepo: ConversationRedisRepository,
  ) {}

  async execute(dto: {
    tenantId: string;
    userId: string;
    channel: string;
  }): Promise<ConversationContextEntity> {
    const existing = await this.redisRepo.getContext(dto.tenantId, dto.userId);
    if (existing) return existing;

    // Bootstrap fresh context
    return new ConversationContextEntity(
      `${dto.tenantId}:${dto.userId}`,
      dto.tenantId,
      dto.userId,
      dto.channel as ConversationChannel,
      ConversationState.IDLE,
    );
  }
}
