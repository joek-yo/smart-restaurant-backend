// src/modules/conversation/application/use-cases/persist-context.use-case.ts
import { Injectable } from '@nestjs/common';
import { ConversationRedisRepository } from '../../infrastructure/redis/conversation.redis.repository';
import { ConversationContextEntity } from '../../domain/entities/conversation-context.entity';
import { ConversationState } from '../../domain/enums/conversation-state.enum';

@Injectable()
export class PersistContextUseCase {
  constructor(
    private readonly redisRepo: ConversationRedisRepository,
  ) {}

  async execute({
    context,
    transition,
  }: {
    dto: any;
    context: ConversationContextEntity;
    transition: { nextState: string };
  }): Promise<void> {
    context.updateState(transition.nextState as ConversationState);
    await this.redisRepo.saveContext(context);
  }
}
