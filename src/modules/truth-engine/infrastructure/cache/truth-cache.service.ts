// FILE: src/modules/truth-engine/infrastructure/cache/truth-cache.service.ts

import { Injectable, Logger } from '@nestjs/common';

/**
 * TruthCacheService
 * -----------------
 * High-performance cache layer for Truth Engine snapshots.
 *
 * Responsibilities:
 * - Store/retrieve TruthSnapshot by deterministic keys
 * - Handle TTL lifecycle
 * - Provide fallback in-memory cache (safety net)
 * - Isolate caching concerns from core Truth Engine logic
 *
 * KEY STRATEGY:
 * - truth:{tenantId}:{sessionId}
 * - truth:{tenantId}:global
 */
@Injectable()
export class TruthCacheService {
  private readonly logger = new Logger(TruthCacheService.name);

  /**
   * In-memory fallback cache (only used if Redis is unavailable)
   */
  private readonly memoryCache = new Map<
    string,
    { value: any; expiresAt: number | null }
  >();

  constructor(
    // Replace with actual Redis service when available
    private readonly redis?: any,
  ) {}

  // =====================================================
  // 🔑 KEY BUILDER
  // =====================================================

  buildKey(tenantId: string, sessionId?: string): string {
    if (sessionId) {
      return `truth:${tenantId}:${sessionId}`;
    }
    return `truth:${tenantId}:global`;
  }

  // =====================================================
  // 💾 GET
  // =====================================================

  async get<T = any>(key: string): Promise<T | null> {
    try {
      // 1. Try Redis first
      if (this.redis?.get) {
        const redisValue = await this.redis.get(key);
        if (redisValue) {
          return JSON.parse(redisValue) as T;
        }
      }

      // 2. Fallback memory cache
      const mem = this.memoryCache.get(key);
      if (mem) {
        if (!mem.expiresAt || mem.expiresAt > Date.now()) {
          return mem.value as T;
        }

        this.memoryCache.delete(key);
      }

      return null;
    } catch (err) {
      this.logger.error(`[TruthCache] GET failed`, err);
      return null;
    }
  }

  // =====================================================
  // 💾 SET
  // =====================================================

  async set(
    key: string,
    value: any,
    ttlSeconds = 60,
  ): Promise<void> {
    try {
      const payload = JSON.stringify(value);

      // 1. Redis write
      if (this.redis?.set) {
        await this.redis.set(key, payload, 'EX', ttlSeconds);
      }

      // 2. Memory fallback write
      this.memoryCache.set(key, {
        value,
        expiresAt: ttlSeconds
          ? Date.now() + ttlSeconds * 1000
          : null,
      });
    } catch (err) {
      this.logger.error(`[TruthCache] SET failed`, err);
    }
  }

  // =====================================================
  // 🧹 DELETE / INVALIDATION
  // =====================================================

  async delete(key: string): Promise<void> {
    return this.del(key);
  }

  async del(key: string): Promise<void> {
    try {
      if (this.redis?.del) {
        await this.redis.del(key);
      }

      this.memoryCache.delete(key);
    } catch (err) {
      this.logger.error(`[TruthCache] DELETE failed`, err);
    }
  }

  /**
   * Invalidate all tenant-related cache (heavy operation)
   */
  async invalidateTenant(tenantId: string): Promise<void> {
    const globalKey = this.buildKey(tenantId);
    await this.del(globalKey);

    // NOTE: Redis pattern deletion can be added later
    this.logger.warn(
      `[TruthCache] Tenant invalidation triggered for ${tenantId}`,
    );
  }

  /**
   * Clear all memory cache (debug/testing only)
   */
  clearMemoryCache(): void {
    this.memoryCache.clear();
    this.logger.warn(`[TruthCache] Memory cache cleared`);
  }
}