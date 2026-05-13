// FILE: src/modules/conversation/application/services/memory-window.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { ConversationHistoryService, HistoryMessage } from './conversation-history.service';

export interface MemoryWindow {
  messages: HistoryMessage[];
  summaryBlock: string;
  turnCount: number;
  lastUserMessage: string | null;
  lastAssistantMessage: string | null;
}

@Injectable()
export class MemoryWindowService {
  private readonly logger = new Logger(MemoryWindowService.name);
  private readonly DEFAULT_WINDOW = 8;

  constructor(private readonly history: ConversationHistoryService) {}

  async build(tenantId: string, userId: string, windowSize = this.DEFAULT_WINDOW): Promise<MemoryWindow> {
    const messages = await this.history.getWindow(tenantId, userId, windowSize);
    const userMsgs = messages.filter(m => m.role === 'user');
    const asstMsgs = messages.filter(m => m.role === 'assistant');

    return {
      messages,
      summaryBlock: this.buildSummaryBlock(messages),
      turnCount: userMsgs.length,
      lastUserMessage: userMsgs.at(-1)?.content ?? null,
      lastAssistantMessage: asstMsgs.at(-1)?.content ?? null,
    };
  }

  async buildAnthropicMessages(
    tenantId: string,
    userId: string,
    currentMessage: string,
    windowSize = this.DEFAULT_WINDOW,
  ): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
    const messages = await this.history.getWindow(tenantId, userId, windowSize);

    const history = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    // Anthropic requires strictly alternating turns — dedupe consecutive same-role
    const deduped: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    for (const msg of history) {
      if (deduped.length && deduped.at(-1)!.role === msg.role) continue;
      deduped.push(msg);
    }

    // Always end with the current user message
    if (deduped.at(-1)?.role === 'user') {
      deduped[deduped.length - 1] = { role: 'user', content: currentMessage };
    } else {
      deduped.push({ role: 'user', content: currentMessage });
    }

    return deduped;
  }

  private buildSummaryBlock(messages: HistoryMessage[]): string {
    if (!messages.length) return '';
    return messages
      .slice(-6)
      .map(m => `${m.role === 'user' ? 'User' : 'Bot'}: ${m.content}`)
      .join('\n');
  }
}
