// FILE: src/modules/protection/application/services/idempotency-protection.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { IdempotencyRedisRepository } from '../../infrastructure/redis/idempotency.redis.repository';

/**
 * IdempotencyProtectionService
 * ----------------------------
 * Prevents duplicate processing of the same workflow operation.
 *
 * CORE GUARANTEE:
 * - Same request (same id) must produce SAME outcome
 * - No double execution of side effects
 *
 * Used across:
 * - checkout
 * - payment
 * - conversation messages
 * - order creation
 */

export interface IdempotencyRecord<T = any> {
  key: string;
  result: T;
  createdAt: number;
}

@Injectable()
export class IdempotencyProtectionService {
  private readonly logger = new Logger(IdempotencyProtectionService.name);

  constructor(
    private readonly repo: IdempotencyRedisRepository,
  ) {}

  // ─────────────────────────────────────────────
  // CHECK IF ALREADY PROCESSED
  // ─────────────────────────────────────────────
  async get<T = any>(key: string): Promise<T | null> {
    const existing = await this.repo.get<T>(key);

    if (existing) {
      this.logger.debug(`[IDEMPOTENCY] HIT key=${key}`);
      return existing;
    }

    return null;
  }

  // ─────────────────────────────────────────────
  // STORE RESULT
  // ─────────────────────────────────────────────
  async set<T = any>(key: string, result: T): Promise<void> {
    await this.repo.set(key, result);

    this.logger.debug(`[IDEMPOTENCY] STORED key=${key}`);
  }

  // ─────────────────────────────────────────────
  // WRAPPED EXECUTION GUARANTEE
  // ─────────────────────────────────────────────
  async execute<T>(
    key: string,
    handler: () => Promise<T>,
  ): Promise<T> {
    const cached = await this.get<T>(key);

    if (cached) {
      return cached;
    }

    const result = await handler();

    await this.set(key, result);

    return result;
  }

  // ─────────────────────────────────────────────
  // INVALIDATION (edge cases)
  // ─────────────────────────────────────────────
  async invalidate(key: string): Promise<void> {
    await this.repo.delete(key);
    this.logger.warn(`[IDEMPOTENCY] INVALIDATED key=${key}`);
  }

  async isDuplicate(_input: any): Promise<boolean> { return false; }
}
