// src/modules/conversation/application/services/recovery-engine.service.ts

import { Injectable } from '@nestjs/common';
import { ConversationRedisRepository } from '../../infrastructure/redis/conversation.redis.repository';
import { ConversationState } from '../../domain/enums/conversation-state.enum';
import { ConversationContextEntity } from '../../domain/entities/conversation-context.entity';

/**
 * RecoveryEngineService
 * ---------------------
 * Handles conversation recovery flows:
 * - abandoned sessions
 * - WhatsApp retries / reconnects
 * - timeout-based restoration
 *
 * IMPORTANT RULE:
 * This service does NOT process messages.
 * It ONLY reconstructs state readiness.
 */
@Injectable()
export class RecoveryEngineService {
  constructor(
    private readonly redisRepo: ConversationRedisRepository,
  ) {}

  /**
   * Entry point for recovery detection
   */
  async recover(input: {
    tenantId: string;
    userId: string;
    channel: string;
  }): Promise<ConversationContextEntity | null> {

    const context = await this.redisRepo.getContext(
      input.tenantId,
      input.userId,
    );

    if (!context) {
      return null;
    }

    // =========================
    // CASE 1: ACTIVE SESSION
    // =========================
    if (this.isActive(context.state)) {
      return context;
    }

    // =========================
    // CASE 2: ABANDONED FLOW
    // =========================
    if (this.isRecoverable(context.state)) {
      context.state = ConversationState.RECOVERY_FLOW;

      await this.redisRepo.saveContext(context);

      return context;
    }

    // =========================
    // CASE 3: EXPIRED SESSION
    // =========================
    if (context.state === ConversationState.ABANDONED) {
      const fresh = this.bootstrapNewContext(input);
      await this.redisRepo.saveContext(fresh);
      return fresh;
    }

    return context;
  }

  // ==================================================
  // 🔧 STATE CLASSIFIERS
  // ==================================================

  private isActive(state: ConversationState): boolean {
    return [
      ConversationState.CART_UPDATED,
      ConversationState.BROWSING,
      ConversationState.CHECKOUT,
    ].includes(state);
  }

  private isRecoverable(state: ConversationState): boolean {
    return [
      ConversationState.STARTED,
      ConversationState.BROWSING,
    ].includes(state);
  }

  // ==================================================
  // 🆕 BOOTSTRAP NEW CONTEXT
  // ==================================================

  private bootstrapNewContext(input: {
    tenantId: string;
    userId: string;
    channel: string;
  }): ConversationContextEntity {

    return new ConversationContextEntity(
      `${input.tenantId}:${input.userId}`,
      input.tenantId,
      input.userId,
      input.channel as any,
      ConversationState.IDLE,
    );
  }
}