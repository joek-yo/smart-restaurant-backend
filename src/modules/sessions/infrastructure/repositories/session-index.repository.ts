// FILE: src/domains/sessions/repositories/session-index.repository.ts

import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class SessionIndexRepository {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  // =========================
  // KEY BUILDER
  // =========================
  private key(userId: string): string {
    return `session:index:user:${userId}`;
  }

  // =========================
  // GET SESSION ID
  // =========================
  async getSessionId(userId: string): Promise<string | null> {
    const sessionId = await this.redis.get(this.key(userId));

    if (!sessionId) return null;

    return sessionId;
  }

  // =========================
  // SET SESSION ID
  // =========================
  async setSessionId(
    userId: string,
    sessionId: string,
    ttlSeconds?: number,
  ): Promise<void> {
    if (ttlSeconds) {
      await this.redis.set(
        this.key(userId),
        sessionId,
        'EX',
        ttlSeconds,
      );
      return;
    }

    await this.redis.set(this.key(userId), sessionId);
  }

  // =========================
  // DELETE INDEX
  // =========================
  async delete(userId: string): Promise<void> {
    await this.redis.del(this.key(userId));
  }
}