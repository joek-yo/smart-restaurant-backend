// FILE: src/modules/protection/infrastructure/redis/workflow-cache.redis.repository.ts

import { Injectable, Inject, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

/**
 * WorkflowCacheRedisRepository
 * ----------------------------
 * High-speed cache layer for workflow state snapshots.
 *
 * Used for:
 * - conversation state restore
 * - checkout recovery
 * - payment retry flows
 * - session hydration
 *
 * NOT a source of truth.
 * ONLY performance + recovery acceleration.
 */
@Injectable()
export class WorkflowCacheRedisRepository {
  private readonly logger = new Logger(WorkflowCacheRedisRepository.name);

  private readonly TTL_SECONDS = 60 * 60 * 2; // 2 hours

  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {}

  // ==================================================
  // STORE WORKFLOW SNAPSHOT
  // ==================================================
  async setWorkflowState(
    key: string,
    state?: {
      traceId: string;
      tenantId: string;
      userId: string;
      type: 'CONVERSATION' | 'CHECKOUT' | 'PAYMENT' | 'SESSION';
      state: string;
      payload?: Record<string, any>;
      updatedAt?: Date;
    },
  ): Promise<void> {
    const redisKey = this.buildKey(key);

    const payload = {
      ...state,
      updatedAt: state?.updatedAt ?? new Date(),
    };

    await this.redis.set(
      redisKey,
      JSON.stringify(payload),
      'EX',
      this.TTL_SECONDS,
    );

    this.logger.debug(`[WORKFLOW_CACHE_SET] key=${key} type=${state?.type}`);
  }

  // ==================================================
  // GET WORKFLOW SNAPSHOT
  // ==================================================
  async getWorkflowState<T = any>(
    key: string,
  ): Promise<T | null> {
    const raw = await this.redis.get(this.buildKey(key));

    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch (err) {
      this.logger.error(`[WORKFLOW_CACHE_PARSE_ERROR] key=${key}`);
      return null;
    }
  }

  // ==================================================
  // CHECK EXISTENCE
  // ==================================================
  async exists(key: string): Promise<boolean> {
    const val = await this.redis.exists(this.buildKey(key));
    return val === 1;
  }

  // ==================================================
  // DELETE CACHE (FOR CLEAN RECOVERY RESET)
  // ==================================================
  async delete(key: string): Promise<void> {
    await this.redis.del(this.buildKey(key));
    this.logger.debug(`[WORKFLOW_CACHE_DELETED] key=${key}`);
  }

  // ==================================================
  // REFRESH TTL (KEEP ALIVE ACTIVE FLOWS)
  // ==================================================
  async refreshTTL(key: string): Promise<void> {
    await this.redis.expire(this.buildKey(key), this.TTL_SECONDS);
  }

  // ==================================================
  // INTERNAL KEY NAMESPACE
  // ==================================================
  private buildKey(key: string): string {
    return `protection:workflow-cache:${key}`;
  }
}