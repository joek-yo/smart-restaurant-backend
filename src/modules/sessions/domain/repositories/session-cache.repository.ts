// FILE: src/modules/sessions/domain/repositories/session-cache.repository.ts

import {
  Injectable,
  Inject,
} from '@nestjs/common';

import Redis from 'ioredis';

import { SessionEntity } from '../entities/session.entity';

// ─────────────────────────────────────────────
// Deterministic Redis Key Strategy
// ─────────────────────────────────────────────

export const SessionCacheKeys = {
  session: (
    tenantId: string,
    userId: string,
    branchId?: string,
  ) =>
    [
      'session',
      tenantId,
      branchId ?? 'default',
      userId,
    ].join(':'),

  sessionById: (sessionId: string) =>
    `session:id:${sessionId}`,
};

// ─────────────────────────────────────────────
// Abstract Contract
// ─────────────────────────────────────────────

export abstract class SessionCacheRepository {
  abstract set(
    session: SessionEntity,
    ttlSeconds?: number,
  ): Promise<void>;

  abstract get(
    tenantId: string,
    userId: string,
    branchId?: string,
  ): Promise<SessionEntity | null>;

  abstract getBySessionId(
    sessionId: string,
  ): Promise<SessionEntity | null>;

  abstract delete(
    tenantId: string,
    userId: string,
    branchId?: string,
  ): Promise<void>;

  abstract deleteBySessionId(
    sessionId: string,
  ): Promise<void>;
}

// ─────────────────────────────────────────────
// Redis Implementation
// ─────────────────────────────────────────────

@Injectable()
export class RedisSessionCacheRepository
  extends SessionCacheRepository
{
  private readonly DEFAULT_TTL =
    60 * 60 * 3;

  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {
    super();
  }

  // ─────────────────────────────────────────────
  // Set Session
  // ─────────────────────────────────────────────

  async set(
    session: SessionEntity,
    ttlSeconds = this.DEFAULT_TTL,
  ): Promise<void> {
    if (!session.id) {
      throw new Error(
        'Cannot cache session without sessionId',
      );
    }

    const key = SessionCacheKeys.session(
      session.tenantId,
      session.userId,
      session.branchId,
    );

    const lookupKey =
      SessionCacheKeys.sessionById(
        session.id,
      );

    const payload = JSON.stringify({
      id: session.id,
      businessId: session.businessId,
      branchId: session.branchId,
      userId: session.userId,
      state: session.state,
      items: session.items,
      discount: session.discount,
      expiresAt: session.expiresAt,
      recovery: session.recovery,
      checkout: session.checkout,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    });

    // Primary cache
    await this.redis.set(
      key,
      payload,
      'EX',
      ttlSeconds,
    );

    // Deterministic lookup map
    await this.redis.set(
      lookupKey,
      key,
      'EX',
      ttlSeconds,
    );
  }

  // ─────────────────────────────────────────────
  // Get Session
  // ─────────────────────────────────────────────

  async get(
    tenantId: string,
    userId: string,
    branchId?: string,
  ): Promise<SessionEntity | null> {
    const key = SessionCacheKeys.session(
      tenantId,
      userId,
      branchId,
    );

    const data =
      await this.redis.get(key);

    if (!data) {
      return null;
    }

    return this.hydrate(data);
  }

  // ─────────────────────────────────────────────
  // Get By SessionId
  // ─────────────────────────────────────────────

  async getBySessionId(
    sessionId: string,
  ): Promise<SessionEntity | null> {
    const lookupKey =
      SessionCacheKeys.sessionById(
        sessionId,
      );

    const sessionKey =
      await this.redis.get(lookupKey);

    if (!sessionKey) {
      return null;
    }

    const data =
      await this.redis.get(sessionKey);

    if (!data) {
      return null;
    }

    return this.hydrate(data);
  }

  // ─────────────────────────────────────────────
  // Delete Session
  // ─────────────────────────────────────────────

  async delete(
    tenantId: string,
    userId: string,
    branchId?: string,
  ): Promise<void> {
    const key = SessionCacheKeys.session(
      tenantId,
      userId,
      branchId,
    );

    const data =
      await this.redis.get(key);

    if (data) {
      const parsed = JSON.parse(data);

      if (parsed.id) {
        await this.redis.del(
          SessionCacheKeys.sessionById(
            parsed.id,
          ),
        );
      }
    }

    await this.redis.del(key);
  }

  // ─────────────────────────────────────────────
  // Delete By SessionId
  // ─────────────────────────────────────────────

  async deleteBySessionId(
    sessionId: string,
  ): Promise<void> {
    const lookupKey =
      SessionCacheKeys.sessionById(
        sessionId,
      );

    const sessionKey =
      await this.redis.get(lookupKey);

    if (sessionKey) {
      await this.redis.del(sessionKey);
    }

    await this.redis.del(lookupKey);
  }

  // ─────────────────────────────────────────────
  // Internal Hydration
  // ─────────────────────────────────────────────

  private hydrate(
    raw: string,
  ): SessionEntity {
    const parsed = JSON.parse(raw);

    return new SessionEntity({
      id: parsed.id,
      businessId: parsed.businessId,
      branchId: parsed.branchId,
      userId: parsed.userId,
      state: parsed.state,
      items: parsed.items,
      discount: parsed.discount,
      expiresAt: parsed.expiresAt
        ? new Date(parsed.expiresAt)
        : undefined,
      recovery: parsed.recovery
        ? {
            ...parsed.recovery,
            recoveredAt: new Date(
              parsed.recovery.recoveredAt,
            ),
          }
        : undefined,
      checkout: parsed.checkout
        ? {
            startedAt:
              parsed.checkout.startedAt
                ? new Date(
                    parsed.checkout.startedAt,
                  )
                : undefined,
            confirmedAt:
              parsed.checkout.confirmedAt
                ? new Date(
                    parsed.checkout.confirmedAt,
                  )
                : undefined,
            completedAt:
              parsed.checkout.completedAt
                ? new Date(
                    parsed.checkout.completedAt,
                  )
                : undefined,
            cancelledAt:
              parsed.checkout.cancelledAt
                ? new Date(
                    parsed.checkout.cancelledAt,
                  )
                : undefined,
          }
        : undefined,
      createdAt: parsed.createdAt
        ? new Date(parsed.createdAt)
        : undefined,
      updatedAt: parsed.updatedAt
        ? new Date(parsed.updatedAt)
        : undefined,
    });
  }
}