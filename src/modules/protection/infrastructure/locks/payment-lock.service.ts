// FILE: src/modules/protection/infrastructure/locks/payment-lock.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { RedisLockService } from './redis-lock.service';
import { WorkflowLockIdVO } from '../../domain/value-objects/workflow-lock-id.vo';

/**
 * PaymentLockService
 * ------------------
 * Distributed lock for payment execution flows.
 *
 * PURPOSE:
 * - Prevent double payment charges
 * - Prevent concurrent payment confirmation callbacks
 * - Ensure idempotent payment processing per order/session
 *
 * RULE:
 * Only ONE payment operation can execute per lock scope.
 */
@Injectable()
export class PaymentLockService {
  private readonly logger = new Logger(PaymentLockService.name);

  // Shorter TTL than checkout (payments are fast but critical)
  private readonly TTL_SECONDS = 60 * 3; // 3 minutes

  constructor(private readonly redisLock: RedisLockService) {}

  /**
   * Acquire payment lock
   */
  async acquire(input: {
    tenantId: string;
    userId: string;
    orderId?: string;
    sessionId?: string;
  }): Promise<boolean> {
    const lockId = this.buildLockId(input);

    this.logger.debug(`[LOCK] acquiring payment lock=${lockId.getValue()}`);

    return this.redisLock.acquire(lockId.getValue(), this.TTL_SECONDS);
  }

  /**
   * Release payment lock
   */
  async release(input: {
    tenantId: string;
    userId: string;
    orderId?: string;
    sessionId?: string;
  }): Promise<void> {
    const lockId = this.buildLockId(input);

    this.logger.debug(`[LOCK] releasing payment lock=${lockId.getValue()}`);

    await this.redisLock.release(lockId.getValue());
  }

  /**
   * Check if payment flow is locked
   */
  async isLocked(input: {
    tenantId: string;
    userId: string;
    orderId?: string;
    sessionId?: string;
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
    orderId?: string;
    sessionId?: string;
  }): WorkflowLockIdVO {
    /**
     * Lock scope priority:
     * 1. orderId (strongest - prevents duplicate charges per order)
     * 2. sessionId fallback
     *
     * Ensures strict payment idempotency across retries/webhooks.
     */
    const raw = input.orderId
      ? `payment:${input.tenantId}:${input.orderId}`
      : input.sessionId
        ? `payment:${input.tenantId}:${input.userId}:${input.sessionId}`
        : `payment:${input.tenantId}:${input.userId}`;

    return new WorkflowLockIdVO(raw);
  }
}