// FILE: src/modules/conversation/infrastructure/adapters/whatsapp/whatsapp-rate-limit.service.ts

import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class WhatsAppRateLimitService {
  private readonly PREFIX = 'whatsapp:rate:';
  private readonly WINDOW_SECONDS = 60;
  private readonly MAX_PER_MINUTE = 20;
  private readonly MAX_BURST = 5;

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  private key(tenantId: string, userId: string): string {
    return `${this.PREFIX}${tenantId}:${userId}`;
  }

  async allow(tenantId: string, userId: string): Promise<boolean> {
    const key = this.key(tenantId, userId);
    const now = Date.now();
    const raw = await this.redis.get(key);
    const data: number[] = raw ? JSON.parse(raw) : [];
    const windowStart = now - this.WINDOW_SECONDS * 1000;
    const recent = data.filter(t => t > windowStart);

    // burst protection
    if (recent.slice(-this.MAX_BURST).length >= this.MAX_BURST) return false;
    // per-minute cap
    if (recent.length >= this.MAX_PER_MINUTE) return false;

    recent.push(now);
    await this.redis.set(key, JSON.stringify(recent), 'EX', this.WINDOW_SECONDS);
    return true;
  }

  async getUsage(tenantId: string, userId: string): Promise<{ count: number; limit: number }> {
    const raw = await this.redis.get(this.key(tenantId, userId));
    const data: number[] = raw ? JSON.parse(raw) : [];
    const windowStart = Date.now() - this.WINDOW_SECONDS * 1000;
    return { count: data.filter(t => t > windowStart).length, limit: this.MAX_PER_MINUTE };
  }

  async reset(tenantId: string, userId: string): Promise<void> {
    await this.redis.del(this.key(tenantId, userId));
  }
}
