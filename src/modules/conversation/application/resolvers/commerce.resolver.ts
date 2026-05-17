import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConversationIntent } from '../../domain/enums/conversation-intent.enum';
import { IntentResolver, ResolverRegistry } from './resolver.registry';

@Injectable()
export class CommerceResolver implements IntentResolver, OnModuleInit {
  readonly name = 'commerce';
  readonly priority = 20;

  private readonly patterns: { pattern: RegExp; intent: ConversationIntent }[] = [
    { pattern: /\b(add|want|order|buy|get)\b.*(item|product)/i, intent: ConversationIntent.ADD_TO_CART },
    { pattern: /\b(remove|delete|drop)\b.*(item|product|from cart)/i, intent: ConversationIntent.REMOVE_FROM_CART },
    { pattern: /\b(show|view|see|check)\b.*(cart|basket|order)/i, intent: ConversationIntent.VIEW_CART },
    { pattern: /\b(show|view|see|browse|list)\b.*(catalog|products|items)/i, intent: ConversationIntent.VIEW_PRODUCTS },
    { pattern: /\b(checkout|place order|confirm order|pay)\b/i, intent: ConversationIntent.CHECKOUT },
    { pattern: /\b(confirm|yes|proceed|go ahead)\b/i, intent: ConversationIntent.CONFIRM_ORDER },
    { pattern: /\b(cancel|stop|abort|nevermind)\b/i, intent: ConversationIntent.CANCEL_ORDER },
    { pattern: /\b(track|where is|status of)\b.*(order)/i, intent: ConversationIntent.VIEW_CART },
    { pattern: /\b(continue|resume|pick up)\b.*(order)/i, intent: ConversationIntent.CONTINUE_ORDER },
  ];

  constructor(private readonly registry: ResolverRegistry) {}

  onModuleInit() {
    this.registry.register(this);
  }

  resolve(message: string): ConversationIntent | null {
    for (const { pattern, intent } of this.patterns) {
      if (pattern.test(message)) return intent;
    }
    return null;
  }
}
