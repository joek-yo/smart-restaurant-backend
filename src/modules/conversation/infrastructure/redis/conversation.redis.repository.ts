// src/modules/conversation/infrastructure/redis/conversation.redis.repository.ts

import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';
import { RedisKeys } from './redis.keys';

import { ConversationContextEntity } from '../../domain/entities/conversation-context.entity';
import { ConversationChannel } from '../../domain/enums/conversation-channel.enum';
import { ConversationState } from '../../domain/enums/conversation-state.enum';

/**
 * ConversationRedisRepository
 * ---------------------------
 * PURE conversation memory persistence layer.
 *
 * Responsibilities:
 * - Store/retrieve conversation context
 * - Handle retry-safe idempotency
 * - Track abandonment signals
 * - Support recovery flows
 *
 * ❌ MUST NOT store:
 * - cart
 * - orders
 * - payments
 * - business state
 */

@Injectable()
export class ConversationRedisRepository {
  private readonly DEFAULT_TTL_SECONDS = 60 * 60 * 3; // 3 hours

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  // ==================================================
  // CONTEXT LOAD
  // ==================================================

  async getContext(
    tenantId: string,
    userId: string,
  ): Promise<ConversationContextEntity | null> {
    const key = RedisKeys.conversationContext(tenantId, userId);
    const data = await this.redis.get(key);

    if (!data) return null;

    try {
      const parsed = JSON.parse(data);

      return new ConversationContextEntity({
        id: parsed.id,
        tenantId: parsed.tenantId,
        userId: parsed.userId,
        channel: parsed.channel as ConversationChannel,
        state: parsed.state as ConversationState,
        memory: parsed.memory ?? {},
        pendingPrompt: parsed.pendingPrompt,
        recoveryMarker: parsed.recoveryMarker,
        expiresAt: parsed.expiresAt
          ? new Date(parsed.expiresAt)
          : undefined,
        updatedAt: parsed.updatedAt
          ? new Date(parsed.updatedAt)
          : undefined,
      });
    } catch (err) {
      // 🔥 CORRUPTION SAFETY: never crash conversation flow
      console.error('[CONVERSATION_REDIS_PARSE_ERROR]', err);
      return null;
    }
  }

  // ==================================================
  // CONTEXT SAVE
  // ==================================================

  async saveContext(
    context: ConversationContextEntity,
  ): Promise<void> {
    const key = RedisKeys.conversationContext(
      context.tenantId,
      context.userId,
    );

    const payload = {
      id: context.id,
      tenantId: context.tenantId,
      userId: context.userId,
      channel: context.channel,
      state: context.state,
      memory: context.memory ?? {},
      pendingPrompt: context.pendingPrompt,
      recoveryMarker: context.recoveryMarker,
      expiresAt: context.expiresAt,
      updatedAt: context.updatedAt,
    };

    await this.redis.set(
      key,
      JSON.stringify(payload),
      'EX',
      this.DEFAULT_TTL_SECONDS,
    );
  }

  // ==================================================
  // PARTIAL UPDATE (SAFE MERGE)
  // ==================================================

  async updateContext(
    tenantId: string,
    userId: string,
    partial: Partial<ConversationContextEntity>,
  ): Promise<void> {
    const existing = await this.getContext(tenantId, userId);

    if (!existing) {
      throw new Error('Conversation context not found');
    }

    const updated = new ConversationContextEntity({
      ...existing,
      ...partial,
      updatedAt: new Date(),
    });

    await this.saveContext(updated);
  }

  // ==================================================
  // DELETE CONTEXT
  // ==================================================

  async deleteContext(
    tenantId: string,
    userId: string,
  ): Promise<void> {
    const key = RedisKeys.conversationContext(tenantId, userId);
    await this.redis.del(key);
  }

  // ==================================================
  // ABANDONMENT TRACKING
  // ==================================================

  async markAbandoned(
    tenantId: string,
    userId: string,
  ): Promise<void> {
    const key = RedisKeys.abandonment(tenantId);

    await this.redis.hset(
      key,
      userId,
      JSON.stringify({
        userId,
        abandonedAt: new Date(),
      }),
    );
  }

  async clearAbandonment(
    tenantId: string,
    userId: string,
  ): Promise<void> {
    const key = RedisKeys.abandonment(tenantId);
    await this.redis.hdel(key, userId);
  }

  // ==================================================
  // IDEMPOTENCY (RETRY SAFETY)
  // ==================================================

  async getProcessedMessage(
    tenantId: string,
    userId: string,
    messageId: string,
  ): Promise<{
    response: string;
    events: string[];
    nextState: string;
  } | null> {
    const key = RedisKeys.messageIdempotency(
      tenantId,
      userId,
      messageId,
    );

    const data = await this.redis.get(key);
    if (!data) return null;

    try {
      return JSON.parse(data);
    } catch (err) {
      console.error('[IDEMPOTENCY_PARSE_ERROR]', err);
      return null;
    }
  }

  async markMessageProcessed(
    tenantId: string,
    userId: string,
    messageId: string,
    result: {
      response: string;
      events: string[];
      nextState: string;
    },
  ): Promise<void> {
    const key = RedisKeys.messageIdempotency(
      tenantId,
      userId,
      messageId,
    );

    await this.redis.set(
      key,
      JSON.stringify(result),
      'EX',
      60 * 60 * 24, // 24h retention
    );
  }
}