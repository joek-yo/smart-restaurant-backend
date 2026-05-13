// FILE: src/modules/conversation/application/resolvers/ai.resolver.ts

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConversationIntent } from '../../domain/enums/conversation-intent.enum';
import { IntentResolver, ResolverRegistry } from './resolver.registry';
import { MemoryWindowService } from '../services/memory-window.service';
import { ContextVaultService } from '../services/context-vault.service';

@Injectable()
export class AiResolver implements IntentResolver, OnModuleInit {
  readonly name = 'ai';
  readonly priority = 50;

  private readonly logger = new Logger(AiResolver.name);
  private readonly apiKey: string;
  private readonly model: string;
  private readonly enabled: boolean;

  private readonly intentMap: Record<string, ConversationIntent> = {
    VIEW_PRODUCTS:    ConversationIntent.VIEW_PRODUCTS,
    VIEW_CART:        ConversationIntent.VIEW_CART,
    ADD_TO_CART:      ConversationIntent.ADD_TO_CART,
    REMOVE_FROM_CART: ConversationIntent.REMOVE_FROM_CART,
    CHECKOUT:         ConversationIntent.CHECKOUT,
    CONFIRM_ORDER:    ConversationIntent.CONFIRM_ORDER,
    CANCEL_ORDER:     ConversationIntent.CANCEL_ORDER,
    ASK_HELP:         ConversationIntent.ASK_HELP,
    SMALL_TALK:       ConversationIntent.SMALL_TALK,
    UNKNOWN:          ConversationIntent.UNKNOWN,
  };

  constructor(
    private readonly registry: ResolverRegistry,
    private readonly config: ConfigService,
    private readonly memoryWindow: MemoryWindowService,
    private readonly vault: ContextVaultService,
  ) {
    this.apiKey  = this.config.get<string>('ANTHROPIC_API_KEY', '');
    this.model   = this.config.get<string>('AI_INTENT_MODEL', 'claude-sonnet-4-20250514');
    this.enabled = !!this.apiKey;
  }

  onModuleInit() {
    if (!this.enabled) this.logger.warn('[AiResolver] ANTHROPIC_API_KEY not set — disabled');
    this.registry.register(this);
  }

  resolve(_message: string, _context?: any): ConversationIntent | null {
    return null;
  }

  async resolveAsync(message: string, context?: any): Promise<ConversationIntent> {
    if (!this.enabled) return ConversationIntent.UNKNOWN;

    try {
      const tenantId: string = context?.tenantId ?? 'unknown';
      const userId: string   = context?.userId   ?? 'unknown';

      const [window, vaultSnapshot] = await Promise.all([
        this.memoryWindow.build(tenantId, userId, 6),
        Promise.resolve(
          context?.conversationContext
            ? this.vault.snapshot(context.conversationContext)
            : '',
        ),
      ]);

      const intents = Object.keys(this.intentMap).join(', ');

      const systemPrompt = [
        `You are an intent classifier for a commerce chatbot.`,
        `Classify the user message into exactly ONE of: ${intents}.`,
        `Respond with ONLY the intent label, nothing else.`,
        vaultSnapshot       ? `\nUser context:\n${vaultSnapshot}`              : '',
        window.summaryBlock ? `\nRecent conversation:\n${window.summaryBlock}` : '',
      ].filter(Boolean).join('\n');

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 20,
          system: systemPrompt,
          messages: [{ role: 'user', content: message }],
        }),
      });

      if (!response.ok) {
        this.logger.error(`[AiResolver] HTTP ${response.status}`);
        return ConversationIntent.UNKNOWN;
      }

      const data: any = await response.json();
      const raw    = data?.content?.[0]?.text?.trim().toUpperCase() ?? 'UNKNOWN';
      const intent = this.intentMap[raw] ?? ConversationIntent.UNKNOWN;

      this.logger.debug(`[AiResolver] "${message}" → ${intent} (turns=${window.turnCount})`);
      return intent;

    } catch (err) {
      this.logger.error('[AiResolver] failed', err);
      return ConversationIntent.UNKNOWN;
    }
  }
}
