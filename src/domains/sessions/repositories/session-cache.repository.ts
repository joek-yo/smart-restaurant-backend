// FILE: src/domains/sessions/repositories/session-cache.repository.ts

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
// IN-MEMORY IMPLEMENTATION
// ========================
@Injectable()
export class InMemorySessionCacheRepository extends SessionCacheRepository {
  private cache: Map<string, { session: SessionEntity; expiresAt: number }> =
    new Map();

  async set(session: SessionEntity, ttlSeconds = 3600): Promise<void> {
    const key = this.buildKey(session);
    const expiresAt = Date.now() + ttlSeconds * 1000;

    this.cache.set(key, { session, expiresAt });
  }

  async get(sessionId: string): Promise<SessionEntity | null> {
    const keys = Array.from(this.cache.keys()).filter((k) =>
      k.endsWith(sessionId),
    );

    if (!keys.length) return null;

    const entry = this.cache.get(keys[0]);
    if (!entry) return null;

    if (entry.expiresAt < Date.now()) {
      this.cache.delete(keys[0]);
      return null;
    }

    return entry.session;
  }

  async delete(sessionId: string): Promise<void> {
    const keys = Array.from(this.cache.keys()).filter((k) =>
      k.endsWith(sessionId),
    );

    keys.forEach((k) => this.cache.delete(k));
  }

  private buildKey(session: SessionEntity): string {
    return `${session.businessId || 'default'}:${
      session.branchId || 'default'
    }:${session.id}`;
  }
}

// ========================
// REDIS IMPLEMENTATION (SAFE DISABLED)
// ========================
@Injectable()
export class RedisSessionCacheRepository extends SessionCacheRepository {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
  ) {
    super();
  }

  async set(session: SessionEntity, ttlSeconds = 3600): Promise<void> {
    if (!this.redisClient) return;

    const key = this.buildKey(session);

    await this.redisClient.set(
      key,
      JSON.stringify(session),
      'EX',
      ttlSeconds,
    );
  }

  async get(sessionId: string): Promise<SessionEntity | null> {
    if (!this.redisClient) return null;

    const keys = await this.redisClient.keys(`*:*:${sessionId}`);
    if (!keys.length) return null;

    const data = await this.redisClient.get(keys[0]);
    if (!data) return null;

    return JSON.parse(data) as SessionEntity;
  }

  async delete(sessionId: string): Promise<void> {
    if (!this.redisClient) return;

    const keys = await this.redisClient.keys(`*:*:${sessionId}`);
    if (keys.length) {
      await this.redisClient.del(...keys);
    }
  }

  private buildKey(session: SessionEntity): string {
    return `${session.businessId || 'default'}:${
      session.branchId || 'default'
    }:${session.id}`;
  }
}