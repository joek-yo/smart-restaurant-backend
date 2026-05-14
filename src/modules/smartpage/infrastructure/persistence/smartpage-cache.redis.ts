// FILE: src/modules/smartpage/infrastructure/persistence/smartpage-cache.redis.ts

import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';

import { SmartPage } from '../../domain/entities/smartpage.entity';

/**
 * SmartPageCacheRedis
 * -----------------------------------------------------
 * High-performance caching layer for SmartPage rendering.
 *
 * Responsibilities:
 * - Cache rendered SmartPages
 * - Store resolved page states
 * - Reduce DB + rendering load
 * - Enable ultra-fast UX (<50ms reads)
 */

@Injectable()
export class SmartPageCacheRedis {
  private readonly logger = new Logger(SmartPageCacheRedis.name);

  // TTL defaults
  private readonly PAGE_TTL = 60 * 5; // 5 minutes
  private readonly RUNTIME_TTL = 60 * 2; // 2 minutes

  constructor(
    @InjectRedis()
    private readonly redis: Redis,
  ) {}

  // ==================================================
  // 🧠 CACHE FULL PAGE RESPONSE
  // ==================================================
  async setPageCache(
    key: string,
    page: SmartPage,
    ttl: number = this.PAGE_TTL,
  ): Promise<void> {
    const cacheKey = this.buildPageKey(key);

    await this.redis.set(
      cacheKey,
      JSON.stringify(page),
      'EX',
      ttl,
    );

    this.logger.log(`[SmartPageCache] cached page key=${cacheKey}`);
  }

  // ==================================================
  // 📦 GET CACHED PAGE
  // ==================================================
  async getPageCache(key: string): Promise<SmartPage | null> {
    const cacheKey = this.buildPageKey(key);

    const cached = await this.redis.get(cacheKey);

    if (!cached) return null;

    this.logger.log(`[SmartPageCache] cache hit key=${cacheKey}`);

    return JSON.parse(cached) as SmartPage;
  }

  // ==================================================
  // ⚡ CACHE RUNTIME RENDER RESULT
  // ==================================================
  async setRuntimeCache(
    key: string,
    payload: any,
    ttl: number = this.RUNTIME_TTL,
  ): Promise<void> {
    const cacheKey = this.buildRuntimeKey(key);

    await this.redis.set(
      cacheKey,
      JSON.stringify(payload),
      'EX',
      ttl,
    );

    this.logger.log(
      `[SmartPageCache] runtime cached key=${cacheKey}`,
    );
  }

  // ==================================================
  // 📦 GET RUNTIME CACHE
  // ==================================================
  async getRuntimeCache(key: string): Promise<any | null> {
    const cacheKey = this.buildRuntimeKey(key);

    const cached = await this.redis.get(cacheKey);

    if (!cached) return null;

    this.logger.log(
      `[SmartPageCache] runtime cache hit key=${cacheKey}`,
    );

    return JSON.parse(cached);
  }

  // ==================================================
  // 🧹 INVALIDATE PAGE CACHE
  // ==================================================
  async invalidatePageCache(key: string): Promise<void> {
    const cacheKey = this.buildPageKey(key);

    await this.redis.del(cacheKey);

    this.logger.warn(
      `[SmartPageCache] invalidated page key=${cacheKey}`,
    );
  }

  // ==================================================
  // 🧹 INVALIDATE RUNTIME CACHE
  // ==================================================
  async invalidateRuntimeCache(key: string): Promise<void> {
    const cacheKey = this.buildRuntimeKey(key);

    await this.redis.del(cacheKey);

    this.logger.warn(
      `[SmartPageCache] invalidated runtime key=${cacheKey}`,
    );
  }

  // ==================================================
  // 🔑 CACHE KEY BUILDERS
  // ==================================================
  private buildPageKey(key: string): string {
    return `smartpage:page:${key}`;
  }

  private buildRuntimeKey(key: string): string {
    return `smartpage:runtime:${key}`;
  }
}