// src/modules/checkout/infrastructure/cache/checkout-cache.service.ts

import { Injectable } from '@nestjs/common';
import { CheckoutRedisRepository } from '../persistence/redis/checkout.redis.repository';

/**
 * CHECKOUT CACHE SERVICE
 * ----------------------
 * PURPOSE:
 * This is a SAFE abstraction over Redis layer.
 *
 * RULES:
 * - No Redis logic in use-cases
 * - No key-building in application layer
 * - Only business-friendly cache operations here
 */

@Injectable()
export class CheckoutCacheService {
  constructor(
    private readonly redisRepo: CheckoutRedisRepository,
  ) {}

  // ==================================================
  // 🔒 CHECKOUT LOCKING
  // ==================================================

  async lock(tenantId: string, userId: string, ttlSeconds = 120): Promise<void> {
    await this.redisRepo.lockCheckout(tenantId, userId, ttlSeconds);
  }

  async isLocked(tenantId: string, userId: string): Promise<boolean> {
    return this.redisRepo.isLocked(tenantId, userId);
  }

  async unlock(tenantId: string, userId: string): Promise<void> {
    await this.redisRepo.unlockCheckout(tenantId, userId);
  }

  // ==================================================
  // ⚡ SNAPSHOT MANAGEMENT
  // ==================================================

  async saveSnapshot(
    tenantId: string,
    userId: string,
    snapshot: any,
    ttlSeconds = 3600,
  ): Promise<void> {
    await this.redisRepo.saveSnapshot(tenantId, userId, snapshot, ttlSeconds);
  }

  async getSnapshot(tenantId: string, userId: string): Promise<any | null> {
    return this.redisRepo.getSnapshot(tenantId, userId);
  }

  // ==================================================
  // 🧠 IDEMPOTENCY PROTECTION
  // ==================================================

  async markProcessed(
    tenantId: string,
    userId: string,
    requestId: string,
    ttlSeconds = 300,
  ): Promise<void> {
    await this.redisRepo.setIdempotencyKey(
      tenantId,
      userId,
      requestId,
      ttlSeconds,
    );
  }

  async isDuplicate(
    tenantId: string,
    userId: string,
    requestId: string,
  ): Promise<boolean> {
    return this.redisRepo.isDuplicateRequest(
      tenantId,
      userId,
      requestId,
    );
  }

  // ==================================================
  // 🧩 HIGH-LEVEL CHECKOUT HELPERS
  // (USED BY ORCHESTRATOR)
  // ==================================================

  async safeLockCheckoutFlow(
    tenantId: string,
    userId: string,
    snapshot: any,
  ): Promise<void> {
    await this.lock(tenantId, userId);
    await this.saveSnapshot(tenantId, userId, snapshot);
  }

  async clearCheckoutFlow(tenantId: string, userId: string): Promise<void> {
    await this.unlock(tenantId, userId);
  }
}