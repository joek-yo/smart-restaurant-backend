// src/domains/sessions/repositories/session.repository.ts

import { Injectable, Inject } from '@nestjs/common';
import { SessionEntity } from '../entities/session.entity';
import Redis from 'ioredis';

// ========================
// ABSTRACT CONTRACT
// ========================
export abstract class SessionCacheRepository {
  abstract set(session: SessionEntity, ttlSeconds?: number): Promise<void>;
  abstract get(sessionId: string): Promise<SessionEntity | null>;
  abstract delete(sessionId: string): Promise<void>;
}

// ========================
// REDIS IMPLEMENTATION ONLY
// ========================
@Injectable()
export class RedisSessionCacheRepository extends SessionCacheRepository {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
  ) {
    super();
  }

  // ------------------------
  // KEY STRATEGY (CRITICAL)
  // ------------------------
  private buildKey(session: SessionEntity): string {
    return `${session.businessId || 'default'}:${
      session.branchId || 'default'
    }:${session.id}`;
  }

  // overload-safe helper for lookup
  private buildKeyFromParts(
    businessId: string,
    branchId: string,
    sessionId: string,
  ): string {
    return `${businessId || 'default'}:${branchId || 'default'}:${sessionId}`;
  }

  // ========================
  // SET SESSION CACHE
  // ========================
  async set(session: SessionEntity, ttlSeconds = 3600): Promise<void> {
    const key = this.buildKey(session);

    await this.redisClient.set(
      key,
      JSON.stringify(session),
      'EX',
      ttlSeconds,
    );
  }

  // ========================
  // GET SESSION CACHE
  // ========================
  async get(sessionId: string): Promise<SessionEntity | null> {
    // IMPORTANT: we assume sessionId alone is not enough for scale lookup
    // so we fallback to pattern only if needed (but this should be improved later)

    const keys = await this.redisClient.keys(`*:*:${sessionId}`);
    if (!keys.length) return null;

    const data = await this.redisClient.get(keys[0]);
    if (!data) return null;

    return JSON.parse(data) as SessionEntity;
  }

  // ========================
  // DELETE SESSION CACHE
  // ========================
  async delete(sessionId: string): Promise<void> {
    const keys = await this.redisClient.keys(`*:*:${sessionId}`);
    if (!keys.length) return;

    await this.redisClient.del(...keys);
  }
}