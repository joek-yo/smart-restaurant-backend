// src/modules/checkout/infrastructure/persistence/redis/checkout.redis.repository.ts

import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * CHECKOUT REDIS REPOSITORY
 * -------------------------
 * PURPOSE:
 * - checkout locking
 * - temporary checkout state
 * - idempotency protection
 * - recovery snapshots
 *
 * IMPORTANT:
 * Redis is NOT source of truth.
 * Mongo is.
 */

@Injectable()
export class CheckoutRedisRepository {
  private readonly PREFIX = 'checkout';

  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {}

  // ==================================================
  // 🔒 CHECKOUT LOCKING
  // Prevent double checkout submission
  // ==================================================

  async lockCheckout(tenantId: string, userId: string, ttlSeconds = 120): Promise<void> {
    const key = this.buildKey(tenantId, userId, 'lock');

    await this.redis.set(key, 'LOCKED', 'EX', ttlSeconds);
  }

  async isLocked(tenantId: string, userId: string): Promise<boolean> {
    const key = this.buildKey(tenantId, userId, 'lock');

    const value = await this.redis.get(key);
    return value === 'LOCKED';
  }

  async unlockCheckout(tenantId: string, userId: string): Promise<void> {
    const key = this.buildKey(tenantId, userId, 'lock');

    await this.redis.del(key);
  }

  // ==================================================
  // ⚡ TEMP CHECKOUT SNAPSHOT
  // Used for recovery or fast resume
  // ==================================================

  async saveSnapshot(
    tenantId: string,
    userId: string,
    snapshot: any,
    ttlSeconds = 3600,
  ): Promise<void> {
    const key = this.buildKey(tenantId, userId, 'snapshot');

    await this.redis.set(
      key,
      JSON.stringify(snapshot),
      'EX',
      ttlSeconds,
    );
  }

  async getSnapshot(tenantId: string, userId: string): Promise<any | null> {
    const key = this.buildKey(tenantId, userId, 'snapshot');

    const data = await this.redis.get(key);
    if (!data) return null;

    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  // ==================================================
  // 🧠 IDEMPOTENCY KEY (VERY IMPORTANT)
  // Prevent duplicate checkout/order submission
  // ==================================================

  async setIdempotencyKey(
    tenantId: string,
    userId: string,
    requestId: string,
    ttlSeconds = 300,
  ): Promise<void> {
    const key = this.buildKey(tenantId, userId, `idemp:${requestId}`);

    await this.redis.set(key, 'PROCESSED', 'EX', ttlSeconds);
  }

  async isDuplicateRequest(
    tenantId: string,
    userId: string,
    requestId: string,
  ): Promise<boolean> {
    const key = this.buildKey(tenantId, userId, `idemp:${requestId}`);

    const value = await this.redis.get(key);
    return value === 'PROCESSED';
  }

  // ==================================================
  // 🧩 KEY BUILDER
  // ==================================================

  private buildKey(
    tenantId: string,
    userId: string,
    suffix: string,
  ): string {
    return `${this.PREFIX}:${tenantId}:${userId}:${suffix}`;
  }
}