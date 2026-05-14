// FILE: src/modules/protection/infrastructure/locks/conversation-lock.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { RedisLockService } from './redis-lock.service';
import { WorkflowLockIdVO } from '../../domain/value-objects/workflow-lock-id.vo';

/**
 * ConversationLockService
 * -----------------------
 * Distributed lock for conversation processing pipelines.
 *
 * PURPOSE:
 * - Prevent duplicate message processing (race conditions)
 * - Avoid parallel state-machine transitions per user
 * - Ensure ordered execution of conversation events
 *
 * RULE:
 * Only ONE conversation pipeline execution per user/tenant/channel at a time.
 */
@Injectable()
export class ConversationLockService {
  private readonly logger = new Logger(ConversationLockService.name);

  // Conversation flows are continuous but short-lived per message burst
  private readonly TTL_SECONDS = 60 * 2; // 2 minutes

  constructor(private readonly redisLock: RedisLockService) {}

  /**
   * Acquire conversation lock
   */
  async acquire(input: {
    tenantId: string;
    userId: string;
    channel?: string;
    messageId?: string;
  }): Promise<boolean> {
    const lockId = this.buildLockId(input);

    this.logger.debug(`[LOCK] acquiring conversation lock=${lockId.getValue()}`);

    return this.redisLock.acquire(lockId.getValue(), this.TTL_SECONDS);
  }

  /**
   * Release conversation lock
   */
  async release(input: {
    tenantId: string;
    userId: string;
    channel?: string;
    messageId?: string;
  }): Promise<void> {
    const lockId = this.buildLockId(input);

    this.logger.debug(`[LOCK] releasing conversation lock=${lockId.getValue()}`);

    await this.redisLock.release(lockId.getValue());
  }

  /**
   * Check if conversation is locked
   */
  async isLocked(input: {
    tenantId: string;
    userId: string;
    channel?: string;
    messageId?: string;
  }): Promise<boolean> {
    const lockId = this.buildLockId(input);

    return this.redisLock.isLocked(lockId.getValue());
  }

  // ─────────────────────────────────────────────
  // 🔐 LOCK KEY STRATEGY
  // ─────────────────────────────────────────────

  private buildLockId(input: {
    tenantId: string;
    userId: string;
    channel?: string;
    messageId?: string;
  }): WorkflowLockIdVO {
    /**
     * Lock scope hierarchy:
     * 1. messageId (strongest - per-message execution)
     * 2. channel (WhatsApp/IG/etc isolation)
     * 3. user (default fallback)
     *
     * Ensures:
     * - ordered message processing
     * - no duplicate pipeline execution
     * - safe retries in distributed workers
     */

    const base = `conversation:${input.tenantId}:${input.userId}`;

    const raw = input.messageId
      ? `${base}:msg:${input.messageId}`
      : input.channel
        ? `${base}:channel:${input.channel}`
        : base;

    return new WorkflowLockIdVO(raw);
  }
}