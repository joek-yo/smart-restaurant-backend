// FILE: src/modules/truth-engine/application/truth-engine.service.ts

import { Injectable, Logger } from '@nestjs/common';

import { TruthSnapshotEntity } from '../domain/truth-snapshot.entity';
import {
  TenantId,
  SessionId,
  UserId,
  TruthCacheKeyString,
} from '../domain/truth.types';

import { TruthSnapshotBuilder } from './truth-snapshot.builder';
import { TruthCacheService } from '../infrastructure/cache/truth-cache.service';

/**
 * =====================================================
 * 🧠 TRUTH ENGINE SERVICE (PUBLIC API)
 * =====================================================
 *
 * This is the ONLY entry point for external modules.
 *
 * Responsibilities:
 * - Check cache first (OPTION B strategy)
 * - Build snapshot if cache miss
 * - Store snapshot in cache
 * - Return immutable TruthSnapshotEntity
 *
 * RULE:
 * ❌ No business logic
 * ❌ No computation logic
 * ❌ No normalization logic
 * ✅ Only orchestration
 * =====================================================
 */

@Injectable()
export class TruthEngineService {
  private readonly logger = new Logger(TruthEngineService.name);

  constructor(
    private readonly builder: TruthSnapshotBuilder,
    private readonly cache: TruthCacheService,
  ) {}

  /**
   * =====================================================
   * 🚀 MAIN PUBLIC METHOD
   * =====================================================
   */
  async getSnapshot(input: {
    tenantId: TenantId;
    sessionId: SessionId;
    userId: UserId;
    forceRefresh?: boolean;
  }): Promise<TruthSnapshotEntity> {
    const { tenantId, sessionId, userId, forceRefresh } = input;

    const cacheKey = this.buildCacheKey(tenantId, sessionId, userId);

    // =====================================================
    // 1. CACHE HIT (OPTION B FAST PATH)
    // =====================================================
    if (!forceRefresh) {
      const cached = await this.cache.get(cacheKey);

      if (cached) {
        this.logger.debug(
          `[TruthEngine] CACHE HIT tenant=${tenantId} session=${sessionId}`,
        );

        return TruthSnapshotEntity.create({
          ...cached,
          meta: {
            ...cached.meta,
            cacheHit: true,
          },
        });
      }
    }

    // =====================================================
    // 2. CACHE MISS → BUILD SNAPSHOT
    // =====================================================
    this.logger.debug(
      `[TruthEngine] CACHE MISS → building snapshot tenant=${tenantId}`,
    );

    const snapshot = await this.builder.build({
      tenantId,
      sessionId,
      userId,
    });

    // =====================================================
    // 3. STORE IN CACHE (OPTION B WRITE-BEHIND)
    // =====================================================
    await this.cache.set(cacheKey, snapshot.toJSON());

    this.logger.debug(
      `[TruthEngine] cached snapshot tenant=${tenantId} session=${sessionId}`,
    );

    return snapshot;
  }

  /**
   * =====================================================
   * ♻️ FORCE REFRESH (BYPASS CACHE)
   * =====================================================
   */
  async refreshSnapshot(input: {
    tenantId: TenantId;
    sessionId: SessionId;
    userId: UserId;
  }): Promise<TruthSnapshotEntity> {
    return this.getSnapshot({
      ...input,
      forceRefresh: true,
    });
  }

  /**
   * =====================================================
   * ❌ CACHE INVALIDATION ENTRYPOINT
   * =====================================================
   */
  async invalidate(input: {
    tenantId: TenantId;
    sessionId: SessionId;
    userId: UserId;
  }): Promise<void> {
    const key = this.buildCacheKey(
      input.tenantId,
      input.sessionId,
      input.userId,
    );

    await this.cache.delete(key);

    this.logger.debug(
      `[TruthEngine] cache invalidated tenant=${input.tenantId}`,
    );
  }

  /**
   * =====================================================
   * 🔑 CACHE KEY BUILDER (OPTION B CORE RULE)
   * =====================================================
   */
  private buildCacheKey(
    tenantId: string,
    sessionId: string,
    userId: string,
  ): TruthCacheKeyString {
    return `truth:${tenantId}:${sessionId}:${userId}`;
  }
}