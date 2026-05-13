// FILE: src/modules/protection/infrastructure/locks/checkout-lock.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { RedisLockService } from './redis-lock.service';
import { WorkflowLockIdVO } from '../../domain/value-objects/workflow-lock-id.vo';

/**
 * CheckoutLockService
 * --------------------
 * Provides distributed locking for checkout workflows.
 *
 * PURPOSE:
 * - Prevent double checkout confirmation
 * - Prevent race conditions during payment/order creation
 * - Ensure single active checkout per user/session
 *
 * RULE:
 * Only ONE checkout execution allowed per lock scope.
 */
@Injectable()
export class CheckoutLockService {
  private readonly logger = new Logger(CheckoutLockService.name);

  // lock TTL (prevents deadlocks)
  private readonly TTL_SECONDS = 60 * 5; // 5 minutes

  constructor(private readonly redisLock: RedisLockService) {}

  /**
   * Acquire checkout lock
   */
  async acquire(input: {
    tenantId: string;
    userId: string;
    sessionId?: string;
  }): Promise<boolean> {
    const lockId = this.buildLockId(input);

    this.logger.debug(`[LOCK] acquiring checkout lock=${lockId.value}`);

    return this.redisLock.acquire(lockId.value, this.TTL_SECONDS);
  }

  /**
   * Release checkout lock
   */
  async release(input: {
    tenantId: string;
    userId: string;
    sessionId?: string;
  }): Promise<void> {
    const lockId = this.buildLockId(input);

    this.logger.debug(`[LOCK] releasing checkout lock=${lockId.value}`);

    await this.redisLock.release(lockId.value);
  }

  /**
   * Check if lock exists
   */
  async isLocked(input: {
    tenantId: string;
    userId: string;
    sessionId?: string;
  }): Promise<boolean> {
    const lockId = this.buildLockId(input);

    return this.redisLock.isLocked(lockId.value);
  }

  // ─────────────────────────────────────────────
  // 🔐 LOCK KEY STRATEGY
  // ─────────────────────────────────────────────

  private buildLockId(input: {
    tenantId: string;
    userId: string;
    sessionId?: string;
  }): WorkflowLockIdVO {
    /**
     * Lock scope:
     * tenant + user + optional session
     *
     * Ensures:
     * - user cannot double-checkout in same tenant
     * - session isolation if sessionId provided
     */
    const raw = input.sessionId
      ? `checkout:${input.tenantId}:${input.userId}:${input.sessionId}`
      : `checkout:${input.tenantId}:${input.userId}`;

    return new WorkflowLockIdVO(raw);
  }
}