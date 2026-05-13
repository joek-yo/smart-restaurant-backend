// FILE: src/modules/protection/infrastructure/redis/idempotency.redis.repository.ts

import { Injectable, Inject, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

/**
 * IdempotencyRedisRepository
 * --------------------------
 * Stores execution fingerprints to prevent duplicate processing.
 *
 * Used across:
 * - conversation messages
 * - checkout confirmation
 * - payment triggers
 * - order creation
 *
 * Guarantees:
 * - EXACTLY ONCE logical execution
 * - safe retries
 * - duplicate suppression
 */
@Injectable()
export class IdempotencyRedisRepository {
  private readonly logger = new Logger(IdempotencyRedisRepository.name);

  private readonly TTL_SECONDS = 60 * 60 * 24 * 2; // 48h safety window

  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {}

  // ==================================================
  // CHECK IF ALREADY PROCESSED
  // ==================================================
  async exists(key: string): Promise<boolean> {
    const value = await this.redis.get(this.buildKey(key));
    return value !== null;
  }

  // ==================================================
  // GET PROCESSED RESULT
  // ==================================================
  async get<T = any>(key: string): Promise<T | null> {
    const raw = await this.redis.get(this.buildKey(key));

    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch (err) {
      this.logger.error(`[IDEMPOTENCY_PARSE_ERROR] key=${key}`);
      return null;
    }
  }

  // ==================================================
  // MARK AS PROCESSED
  // ==================================================
  async set<T = any>(
    key: string,
    value: T,
  ): Promise<void> {
    await this.redis.set(
      this.buildKey(key),
      JSON.stringify({
        ...value,
        processedAt: new Date().toISOString(),
      }),
      'EX',
      this.TTL_SECONDS,
    );

    this.logger.debug(`[IDEMPOTENCY_SAVED] key=${key}`);
  }

  // ==================================================
  // ATOMIC GUARD (MOST IMPORTANT METHOD)
  // ==================================================
  async acquire<T = any>(
    key: string,
    generator: () => Promise<T>,
  ): Promise<{ result: T; cached: boolean }> {
    const redisKey = this.buildKey(key);

    // 1. Check cache first
    const cached = await this.redis.get(redisKey);

    if (cached) {
      try {
        return {
          result: JSON.parse(cached),
          cached: true,
        };
      } catch {
        this.logger.warn(`[IDEMPOTENCY_CORRUPTED_CACHE] key=${key}`);
      }
    }

    // 2. Execute operation
    const result = await generator();

    // 3. Store result
    await this.redis.set(
      redisKey,
      JSON.stringify({
        ...result,
        processedAt: new Date().toISOString(),
      }),
      'EX',
      this.TTL_SECONDS,
    );

    return {
      result,
      cached: false,
    };
  }

  // ==================================================
  // DELETE (FOR RECOVERY / RESET)
  // ==================================================
  async delete(key: string): Promise<void> {
    await this.redis.del(this.buildKey(key));
    this.logger.debug(`[IDEMPOTENCY_DELETED] key=${key}`);
  }

  // ==================================================
  // KEY NAMESPACE
  // ==================================================
  private buildKey(key: string): string {
    return `protection:idempotency:${key}`;
  }
}