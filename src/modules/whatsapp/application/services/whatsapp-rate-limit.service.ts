// src/modules/whatsapp/application/services/whatsapp-rate-limit.service.ts

import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class WhatsAppRateLimitService {
  /**
   * Strategy:
   * - Per user + tenant sliding window
   * - Hard limit per minute + burst protection
   * - Prevents WhatsApp spam, retries floods, bot abuse
   */

  private readonly PREFIX = 'whatsapp:rate:';
  private readonly WINDOW_SECONDS = 60;

  // sensible defaults for MVP safety
  private readonly MAX_MESSAGES_PER_MINUTE = 20;
  private readonly MAX_BURST_MESSAGES = 5; // instant spike protection

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  private key(tenantId: string, userId: string): string {
    return `${this.PREFIX}${tenantId}:${userId}`;
  }

  /**
   * Check if request is allowed
   */
  async allow(tenantId: string, userId: string): Promise<boolean> {
    const key = this.key(tenantId, userId);
    const now = Date.now();

    const raw = await this.redis.get(key);
    const data: number[] = raw ? JSON.parse(raw) : [];

    // keep only last 60 seconds
    const windowStart = now - this.WINDOW_SECONDS * 1000;
    const recent = data.filter((timestamp) => timestamp > windowStart);

    // ─────────────────────────────────────────────
    // 🔥 BURST PROTECTION (too many messages instantly)
    // ─────────────────────────────────────────────
    const lastFew = recent.slice(-this.MAX_BURST_MESSAGES);
    if (lastFew.length >= this.MAX_BURST_MESSAGES) {
      return false;
    }

    // ─────────────────────────────────────────────
    // 📊 RATE LIMIT (per minute cap)
    // ─────────────────────────────────────────────
    if (recent.length >= this.MAX_MESSAGES_PER_MINUTE) {
      return false;
    }

    // record current request
    recent.push(now);

    await this.redis.set(
      key,
      JSON.stringify(recent),
      'EX',
      this.WINDOW_SECONDS,
    );

    return true;
  }

  /**
   * Optional: inspect current usage
   */
  async getUsage(tenantId: string, userId: string): Promise<{
    count: number;
    limit: number;
  }> {
    const key = this.key(tenantId, userId);

    const raw = await this.redis.get(key);
    const data: number[] = raw ? JSON.parse(raw) : [];

    const windowStart = Date.now() - this.WINDOW_SECONDS * 1000;
    const recent = data.filter((t) => t > windowStart);

    return {
      count: recent.length,
      limit: this.MAX_MESSAGES_PER_MINUTE,
    };
  }

  /**
   * Hard reset (useful for admin tools / abuse recovery)
   */
  async reset(tenantId: string, userId: string): Promise<void> {
    await this.redis.del(this.key(tenantId, userId));
  }
}