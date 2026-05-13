// FILE: src/modules/protection/infrastructure/redis/tenant-scope.redis.repository.ts

import { Injectable, Inject, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

/**
 * TenantScopeRedisRepository
 * --------------------------
 * Enforces strict multi-tenant isolation at runtime.
 *
 * This is a SECURITY CRITICAL layer.
 *
 * Responsibilities:
 * - validate tenant ownership
 * - persist active tenant context
 * - detect cross-tenant anomalies
 * - bind user → tenant → workflow relationships
 */
@Injectable()
export class TenantScopeRedisRepository {
  private readonly logger = new Logger(TenantScopeRedisRepository.name);

  private readonly TTL_SECONDS = 60 * 60 * 3; // 3 hours

  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {}

  // ==================================================
  // SET TENANT SCOPE
  // ==================================================
  async setScope(input: {
    tenantId: string;
    userId: string;
    sessionId?: string;
    channel?: string;
  }): Promise<void> {
    const key = this.buildKey(input.tenantId, input.userId);

    const payload = {
      tenantId: input.tenantId,
      userId: input.userId,
      sessionId: input.sessionId,
      channel: input.channel,
      boundAt: new Date(),
    };

    await this.redis.set(
      key,
      JSON.stringify(payload),
      'EX',
      this.TTL_SECONDS,
    );

    this.logger.debug(
      `[TENANT_SCOPE_SET] tenant=${input.tenantId} user=${input.userId}`,
    );
  }

  // ==================================================
  // GET SCOPE
  // ==================================================
  async getScope(tenantId: string, userId: string): Promise<any | null> {
    const raw = await this.redis.get(this.buildKey(tenantId, userId));

    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch (err) {
      this.logger.error(`[TENANT_SCOPE_PARSE_ERROR] ${tenantId}:${userId}`);
      return null;
    }
  }

  // ==================================================
  // VALIDATE SCOPE (CRITICAL GUARD)
  // ==================================================
  async validateScope(input: {
    tenantId: string;
    userId: string;
  }): Promise<boolean> {
    const scope = await this.getScope(input.tenantId, input.userId);

    const valid = !!scope && scope.tenantId === input.tenantId;

    if (!valid) {
      this.logger.warn(
        `[TENANT_SCOPE_VIOLATION] tenant=${input.tenantId} user=${input.userId}`,
      );
    }

    return valid;
  }

  // ==================================================
  // DETECT CROSS-TENANT ACCESS
  // ==================================================
  async detectViolation(input: {
    tenantId: string;
    userId: string;
    claimedTenantId: string;
  }): Promise<boolean> {
    const realScope = await this.getScope(input.tenantId, input.userId);

    const violation =
      !!realScope && realScope.tenantId !== input.claimedTenantId;

    if (violation) {
      this.logger.error(
        `[TENANT_BREACH] user=${input.userId} real=${realScope.tenantId} claimed=${input.claimedTenantId}`,
      );
    }

    return violation;
  }

  // ==================================================
  // UPDATE SESSION CONTEXT
  // ==================================================
  async attachSession(
    tenantId: string,
    userId: string,
    sessionId: string,
  ): Promise<void> {
    const scope = await this.getScope(tenantId, userId);

    if (!scope) return;

    scope.sessionId = sessionId;
    scope.updatedAt = new Date();

    await this.redis.set(
      this.buildKey(tenantId, userId),
      JSON.stringify(scope),
      'EX',
      this.TTL_SECONDS,
    );

    this.logger.debug(
      `[TENANT_SCOPE_SESSION_ATTACHED] tenant=${tenantId} session=${sessionId}`,
    );
  }

  // ==================================================
  // CLEAR SCOPE (LOGOUT / RESET)
  // ==================================================
  async clearScope(tenantId: string, userId: string): Promise<void> {
    await this.redis.del(this.buildKey(tenantId, userId));

    this.logger.debug(
      `[TENANT_SCOPE_CLEARED] tenant=${tenantId} user=${userId}`,
    );
  }

  // ==================================================
  // INTERNAL KEY
  // ==================================================
  private buildKey(tenantId: string, userId: string): string {
    return `protection:tenant-scope:${tenantId}:${userId}`;
  }
}