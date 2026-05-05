// src/domains/sessions/repositories/session-cache.repository.ts

import { Injectable, Inject } from '@nestjs/common';
import { SessionEntity } from '../entities/session.entity';
import Redis from 'ioredis';

// ========================
// ABSTRACT CONTRACT
// ========================
export abstract class SessionCacheRepository {
  // ✅ Explicitly define that we take the Entity
  abstract set(session: SessionEntity, ttlSeconds?: number): Promise<void>;
  abstract get(sessionId: string): Promise<SessionEntity | null>;
  abstract delete(sessionId: string): Promise<void>;
}

// ========================
// REDIS IMPLEMENTATION
// ========================
@Injectable()
export class RedisSessionCacheRepository extends SessionCacheRepository {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
  ) {
    super();
  }

  /**
   * KEY STRATEGY: business:branch:sessionId
   */
  private buildKey(session: SessionEntity): string {
    return `${session.businessId || 'default'}:${
      session.branchId || 'default'
    }:${session.id}`;
  }

  // ========================
  // SET SESSION CACHE
  // ========================
  async set(session: SessionEntity, ttlSeconds = 3600): Promise<void> {
    // If you get a type error here, ensure 'session' is actually an instance of SessionEntity
    const key = this.buildKey(session);

    // Standard Redis practice: Serialize the entity to JSON
    const data = JSON.stringify(session);

    await this.redisClient.set(key, data, 'EX', ttlSeconds);
  }

  // ========================
  // GET SESSION CACHE
  // ========================
  async get(sessionId: string): Promise<SessionEntity | null> {
    // Note: Scanning with KEYS is expensive in production. 
    // Ideally, the service should pass businessId/branchId to build the direct key.
    const keys = await this.redisClient.keys(`*:*:${sessionId}`);
    
    if (keys.length === 0) return null;

    const data = await this.redisClient.get(keys[0]);
    if (!data) return null;

    // Rehydrate the entity from the stored JSON
    return JSON.parse(data) as SessionEntity;
  }

  // ========================
  // DELETE SESSION CACHE
  // ========================
  async delete(sessionId: string): Promise<void> {
    const keys = await this.redisClient.keys(`*:*:${sessionId}`);
    if (keys.length > 0) {
      await this.redisClient.del(...keys);
    }
  }
}