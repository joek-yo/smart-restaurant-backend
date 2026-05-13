// FILE: src/modules/conversation/infrastructure/adapters/whatsapp/whatsapp-idempotency.service.ts

import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class WhatsAppIdempotencyService {
  private readonly PREFIX = 'whatsapp:idempotency:';
  private readonly TTL_SECONDS = 60 * 60 * 24; // 24h

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async isProcessed(messageId: string): Promise<boolean> {
    return !!(await this.redis.get(`${this.PREFIX}${messageId}`));
  }

  async markProcessed(messageId: string, metadata?: { userId?: string; tenantId?: string }): Promise<void> {
    await this.redis.set(
      `${this.PREFIX}${messageId}`,
      JSON.stringify({ messageId, ...metadata, processedAt: new Date().toISOString() }),
      'EX',
      this.TTL_SECONDS,
    );
  }

  async runOnce<T>(messageId: string, handler: () => Promise<T>, metadata?: { userId?: string; tenantId?: string }): Promise<T | null> {
    if (await this.isProcessed(messageId)) return null;
    const result = await handler();
    await this.markProcessed(messageId, metadata);
    return result;
  }
}
