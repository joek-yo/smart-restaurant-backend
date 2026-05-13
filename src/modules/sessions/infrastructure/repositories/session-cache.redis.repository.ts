// FILE: src/domains/sessions/repositories/session-cache.redis.repository.ts

import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { SessionEntity } from '../../domain/entities/session.entity';
import { SessionCacheRepository } from '../../domain/repositories/session-cache.repository';

@Injectable()
export class RedisSessionCacheRepository extends SessionCacheRepository {
  private readonly TTL = 60 * 60; // 1 hour default

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {
    super();
  }

  // =========================
  // KEY STRATEGY
  // =========================
  private key(sessionId: string): string {
    return `session:${sessionId}`;
  }

  // =========================
  // SET CACHE
  // =========================
  async set(session: SessionEntity, ttlSeconds = this.TTL): Promise<void> {
    if (!session.id) return;

    const key = this.key(session.id);

    await this.redis.set(
      key,
      JSON.stringify(session),
      'EX',
      ttlSeconds,
    );
  }

  // =========================
  // GET CACHE
  // =========================
  async get(sessionId: string): Promise<SessionEntity | null> {
    const data = await this.redis.get(this.key(sessionId));

    if (!data) return null;

    try {
      const parsed = JSON.parse(data);
      return new SessionEntity(parsed);
    } catch (err) {
      return null;
    }
  }

  // =========================
  // DELETE CACHE
  // =========================
  async delete(sessionId: string): Promise<void> {
    await this.redis.del(this.key(sessionId));
  }

  async getBySessionId(sessionId: string): Promise<SessionEntity | null> {
    return this.get(sessionId);
  }

  async deleteBySessionId(sessionId: string): Promise<void> {
    await this.redis.del(this.key(sessionId));
  }
}