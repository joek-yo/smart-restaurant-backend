// FILE: src/modules/conversation/application/services/conversation-history.service.ts

import { Injectable, Inject, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

export interface HistoryMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  intent?: string;
  timestamp: string;
  messageId?: string;
}

@Injectable()
export class ConversationHistoryService {
  private readonly logger = new Logger(ConversationHistoryService.name);
  private readonly MAX_HISTORY = 50;
  private readonly TTL_SECONDS = 60 * 60 * 6; // 6h

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  private key(tenantId: string, userId: string): string {
    return `conv:history:${tenantId}:${userId}`;
  }

  async append(tenantId: string, userId: string, message: HistoryMessage): Promise<void> {
    const k = this.key(tenantId, userId);
    await this.redis.rpush(k, JSON.stringify(message));
    await this.redis.ltrim(k, -this.MAX_HISTORY, -1);
    await this.redis.expire(k, this.TTL_SECONDS);
  }

  async getWindow(tenantId: string, userId: string, limit = 10): Promise<HistoryMessage[]> {
    const k = this.key(tenantId, userId);
    const raw = await this.redis.lrange(k, -limit, -1);
    return raw.map(r => {
      try { return JSON.parse(r) as HistoryMessage; }
      catch { return null; }
    }).filter(Boolean) as HistoryMessage[];
  }

  async getAll(tenantId: string, userId: string): Promise<HistoryMessage[]> {
    return this.getWindow(tenantId, userId, this.MAX_HISTORY);
  }

  async clear(tenantId: string, userId: string): Promise<void> {
    await this.redis.del(this.key(tenantId, userId));
  }

  async count(tenantId: string, userId: string): Promise<number> {
    return this.redis.llen(this.key(tenantId, userId));
  }

  async getSummaryBlock(tenantId: string, userId: string, limit = 6): Promise<string> {
    const msgs = await this.getWindow(tenantId, userId, limit);
    if (!msgs.length) return '';
    return msgs
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');
  }
}
