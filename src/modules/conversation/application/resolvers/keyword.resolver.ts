import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConversationIntent } from '../../domain/enums/conversation-intent.enum';
import { IntentResolver, ResolverRegistry } from './resolver.registry';

@Injectable()
export class KeywordResolver implements IntentResolver, OnModuleInit {
  readonly name = 'keyword';
  readonly priority = 10;

  private readonly map: Record<string, ConversationIntent> = {
    menu: ConversationIntent.VIEW_PRODUCTS,
    products: ConversationIntent.VIEW_PRODUCTS,
    order: ConversationIntent.ADD_TO_CART,
    cart: ConversationIntent.VIEW_CART,
    checkout: ConversationIntent.CHECKOUT,
    confirm: ConversationIntent.CONFIRM_ORDER,
    cancel: ConversationIntent.CANCEL_ORDER,
    help: ConversationIntent.ASK_HELP,
    hi: ConversationIntent.SMALL_TALK,
    hello: ConversationIntent.SMALL_TALK,
    start: ConversationIntent.START,
    continue: ConversationIntent.CONTINUE_ORDER,
  };

  constructor(private readonly registry: ResolverRegistry) {}

  onModuleInit() {
    this.registry.register(this);
  }

  resolve(message: string): ConversationIntent | null {
    const lower = message.toLowerCase().trim();
    for (const [keyword, intent] of Object.entries(this.map)) {
      if (lower.includes(keyword)) return intent;
    }
    return null;
  }
}
