// src/modules/whatsapp/application/services/whatsapp-idempotency.service.ts

import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';

/**
 * WhatsAppIdempotencyService
 * --------------------------
 * Guarantees that each WhatsApp message is processed ONLY ONCE.
 *
 * RULE:
 * - If messageId exists → ignore
 * - If not → mark as processed and continue
 */

@Injectable()
export class WhatsAppIdempotencyService {
  private readonly PREFIX = 'whatsapp:idempotency:';

  // 24 hours default protection window
  private readonly TTL_SECONDS = 60 * 60 * 24;

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  // ─────────────────────────────────────────────
  // CHECK IF MESSAGE WAS ALREADY PROCESSED
  // ─────────────────────────────────────────────
  async isProcessed(messageId: string): Promise<boolean> {
    const key = this.buildKey(messageId);
    const exists = await this.redis.get(key);
    return !!exists;
  }

  // ─────────────────────────────────────────────
  // MARK MESSAGE AS PROCESSED
  // ─────────────────────────────────────────────
  async markProcessed(
    messageId: string,
    metadata?: {
      userId?: string;
      tenantId?: string;
      timestamp?: string;
    },
  ): Promise<void> {
    const key = this.buildKey(messageId);

    const payload = {
      messageId,
      ...metadata,
      processedAt: new Date().toISOString(),
    };

    await this.redis.set(
      key,
      JSON.stringify(payload),
      'EX',
      this.TTL_SECONDS,
    );
  }

  // ─────────────────────────────────────────────
  // SAFE PROCESS WRAPPER (BEST PRACTICE)
  // ─────────────────────────────────────────────
  async runOnce<T>(
    messageId: string,
    handler: () => Promise<T>,
    metadata?: {
      userId?: string;
      tenantId?: string;
    },
  ): Promise<T | null> {
    const alreadyProcessed = await this.isProcessed(messageId);

    if (alreadyProcessed) {
      return null; // silently ignore duplicates
    }

    const result = await handler();

    await this.markProcessed(messageId, {
      ...metadata,
      timestamp: new Date().toISOString(),
    });

    return result;
  }

  // ─────────────────────────────────────────────
  // INTERNAL KEY STRATEGY
  // ─────────────────────────────────────────────
  private buildKey(messageId: string): string {
    return `${this.PREFIX}${messageId}`;
  }
}