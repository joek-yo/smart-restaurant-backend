// FILE: src/modules/protection/infrastructure/redis/opt-out.redis.repository.ts

import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

/**
 * OptOutRedisRepository
 * ---------------------------------------------------------
 * Fast-access suppression layer for opt-out state.
 *
 * Purpose:
 * - avoid DB lookup on every WhatsApp message
 * - enforce near-instant blocking (<5ms)
 * - act as first-line defense before workflows/queues run
 *
 * Key rule:
 * Redis is the "hot cache", DB is the "source of truth".
 */

@Injectable()
export class OptOutRedisRepository {
  private readonly logger = new Logger(OptOutRedisRepository.name);

  private readonly PREFIX = 'protection:optout:';

  constructor(private readonly redis: Redis) {}

  // ==================================================
  // 🔐 GET OPT-OUT STATE
  // ==================================================

  async isOptedOut(tenantId: string, userId: string): Promise<boolean> {
    const key = this.buildKey(tenantId, userId);

    try {
      const value = await this.redis.get(key);
      return value === '1';
    } catch (error: any) {
      this.logger.warn(
        `[REDIS] Opt-out lookup failed for ${tenantId}:${userId} - ${error.message}`,
      );
      return false; // fail open (system continues if cache fails)
    }
  }

  // ==================================================
  // 🚫 SET OPT-OUT
  // ==================================================

  async setOptOut(
    tenantId: string,
    userId: string,
    ttlSeconds?: number,
  ): Promise<void> {
    const key = this.buildKey(tenantId, userId);

    try {
      if (ttlSeconds) {
        await this.redis.set(key, '1', 'EX', ttlSeconds);
      } else {
        await this.redis.set(key, '1');
      }
    } catch (error: any) {
      this.logger.error(
        `[REDIS] Failed to set opt-out for ${tenantId}:${userId} - ${error.message}`,
      );
    }
  }

  // ==================================================
  // ✅ REMOVE OPT-OUT (REACTIVATION)
  // ==================================================

  async removeOptOut(tenantId: string, userId: string): Promise<void> {
    const key = this.buildKey(tenantId, userId);

    try {
      await this.redis.del(key);
    } catch (error: any) {
      this.logger.error(
        `[REDIS] Failed to remove opt-out for ${tenantId}:${userId} - ${error.message}`,
      );
    }
  }

  // ==================================================
  // 🔑 KEY BUILDER
  // ==================================================

  private buildKey(tenantId: string, userId: string): string {
    return `${this.PREFIX}${tenantId}:${userId}`;
  }
}