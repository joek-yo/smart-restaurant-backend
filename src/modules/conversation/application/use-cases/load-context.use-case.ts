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

    const existing = await this.redisRepo.getContext(
      dto.tenantId,
      dto.userId,
    );

    // ==================================================
    // 🧠 CASE 1: NO EXISTING CONTEXT
    // ==================================================
    if (!existing) {
      return this.createFreshContext(dto);
    }

    // ==================================================
    // 🧠 CASE 2: EXISTING BUT STALE
    // ==================================================
    const isStale = this.isStale(existing);

    if (isStale) {
      existing.markRecovery(
        existing.state,
        'STALE_SESSION_RELOAD',
      );

      existing.updateState(ConversationState.ABANDONED);

      return existing;
    }

    // ==================================================
    // 🧠 CASE 3: VALID CONTEXT
    // ==================================================
    return existing;
  }

  // ==================================================
  // 🧊 CREATE NEW SESSION CONTEXT
  // ==================================================
  private createFreshContext(dto: {
    tenantId: string;
    userId: string;
    channel: string;
  }): ConversationContextEntity {

    return new ConversationContextEntity(
      `${dto.tenantId}:${dto.userId}`,
      dto.tenantId,
      dto.userId,
      dto.channel as ConversationChannel,
      ConversationState.IDLE,
    );
  }

  // ==================================================
  // ⏱ STALE DETECTION LOGIC
  // ==================================================
  private isStale(context: ConversationContextEntity): boolean {

    const now = Date.now();
    const updatedAt = new Date(context.updatedAt).getTime();

    // 30 min inactivity threshold (safe default)
    const STALE_THRESHOLD = 1000 * 60 * 30;

    return now - updatedAt > STALE_THRESHOLD;
  }
}