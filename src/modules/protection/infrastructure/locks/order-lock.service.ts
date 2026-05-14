// FILE: src/modules/protection/infrastructure/locks/order-lock.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { RedisLockService } from './redis-lock.service';
import { WorkflowLockIdVO } from '../../domain/value-objects/workflow-lock-id.vo';

/**
 * OrderLockService
 * ----------------
 * Distributed lock for order lifecycle mutations.
 *
 * PURPOSE:
 * - Prevent concurrent order updates (status, items, payments)
 * - Avoid race conditions during fulfillment/payment confirmation
 * - Guarantee single-writer consistency for order state transitions
 *
 * RULE:
 * Only ONE order mutation operation allowed per order at a time.
 */
@Injectable()
export class OrderLockService {
  private readonly logger = new Logger(OrderLockService.name);

  // Order operations should be short but highly consistent
  private readonly TTL_SECONDS = 60 * 5; // 5 minutes

  constructor(private readonly redisLock: RedisLockService) {}

  /**
   * Acquire order lock
   */
  async acquire(input: {
    tenantId: string;
    orderId: string;
    userId?: string;
  }): Promise<boolean> {
    const lockId = this.buildLockId(input);

    this.logger.debug(`[LOCK] acquiring order lock=${lockId.getValue()}`);

    return this.redisLock.acquire(lockId.getValue(), this.TTL_SECONDS);
  }

  /**
   * Release order lock
   */
  async release(input: {
    tenantId: string;
    orderId: string;
    userId?: string;
  }): Promise<void> {
    const lockId = this.buildLockId(input);

    this.logger.debug(`[LOCK] releasing order lock=${lockId.getValue()}`);

    await this.redisLock.release(lockId.getValue());
  }

  /**
   * Check if order is locked
   */
  async isLocked(input: {
    tenantId: string;
    orderId: string;
    userId?: string;
  }): Promise<boolean> {
    const lockId = this.buildLockId(input);

    return this.redisLock.isLocked(lockId.getValue());
  }

  // ─────────────────────────────────────────────
  // 🔐 LOCK KEY STRATEGY
  // ─────────────────────────────────────────────

  private buildLockId(input: {
    tenantId: string;
    orderId: string;
    userId?: string;
  }): WorkflowLockIdVO {
    /**
     * Lock scope:
     * - Primary: orderId (ensures single order mutation stream)
     * - Optional: userId for trace/debug separation
     *
     * Ensures:
     * - no double status updates
     * - no concurrent payment/order modifications
     * - safe webhook + internal updates
     */

    const raw = input.userId
      ? `order:${input.tenantId}:${input.orderId}:${input.userId}`
      : `order:${input.tenantId}:${input.orderId}`;

    return new WorkflowLockIdVO(raw);
  }
}