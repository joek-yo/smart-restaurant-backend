// FILE: src/modules/protection/infrastructure/locks/redis-lock.service.ts

import { Injectable, Inject, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

/**
 * RedisLockService
 * -----------------
 * Distributed lock engine for all workflow protection layers.
 *
 * Guarantees:
 * - Single execution per workflow key
 * - Cross-instance safety (multi-node system)
 * - TTL-based auto-recovery
 *
 * RULE:
 * ❌ NEVER use for business logic
 * ✅ ONLY for concurrency protection
 */
@Injectable()
export class RedisLockService {
  private readonly logger = new Logger(RedisLockService.name);

  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {}

  /**
   * Acquire a distributed lock
   */
  async acquire(
    key: string,
    ttlSeconds = 30,
  ): Promise<{ acquired: boolean; lockId?: string }> {
    const lockId = uuidv4();

    const result = await (this.redis as any).set(
      this.buildKey(key),
      lockId,
      'EX',
      ttlSeconds,
      'NX',
    );

    if (result === 'OK') {
      this.logger.debug(`[LOCK ACQUIRED] key=${key} lockId=${lockId}`);
      return { acquired: true, lockId };
    }

    return { acquired: false };
  }

  /**
   * Release lock safely (only if owner)
   */
  async release(key: string, lockId: string): Promise<boolean> {
    const redisKey = this.buildKey(key);

    const current = await this.redis.get(redisKey);

    if (current !== lockId) {
      this.logger.warn(
        `[LOCK RELEASE BLOCKED] key=${key} expected=${lockId} actual=${current}`,
      );
      return false;
    }

    await this.redis.del(redisKey);

    this.logger.debug(`[LOCK RELEASED] key=${key}`);
    return true;
  }

  /**
   * Extend lock TTL (heartbeat / long workflows)
   */
  async extend(
    key: string,
    lockId: string,
    ttlSeconds = 30,
  ): Promise<boolean> {
    const redisKey = this.buildKey(key);

    const current = await this.redis.get(redisKey);

    if (current !== lockId) {
      return false;
    }

    await this.redis.expire(redisKey, ttlSeconds);

    this.logger.debug(`[LOCK EXTENDED] key=${key} ttl=${ttlSeconds}`);
    return true;
  }

  /**
   * Check lock ownership
   */
  async isLocked(key: string): Promise<boolean> {
    const val = await this.redis.get(this.buildKey(key));
    return !!val;
  }

  /**
   * Get lock owner
   */
  async getLockId(key: string): Promise<string | null> {
    return this.redis.get(this.buildKey(key));
  }

  /**
   * Internal key namespace isolation
   */
  /**
   * Force release without ownership check (recovery only)
   */
  async forceRelease(key: string): Promise<void> {
    await this.redis.del(this.buildKey(key));
    this.logger.warn(`[LOCK FORCE RELEASED] key=${key}`);
  }

  private buildKey(key: string): string {
    return `protection:lock:${key}`;
  }
}