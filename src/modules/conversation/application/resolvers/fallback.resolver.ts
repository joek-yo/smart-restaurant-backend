import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConversationIntent } from '../../domain/enums/conversation-intent.enum';
import { IntentResolver, ResolverRegistry } from './resolver.registry';

@Injectable()
export class FallbackResolver implements IntentResolver, OnModuleInit {
  readonly name = 'fallback';
  readonly priority = 100;

  constructor(private readonly registry: ResolverRegistry) {}

  onModuleInit() {
    this.registry.register(this);
  }

  resolve(): ConversationIntent {
    return ConversationIntent.UNKNOWN;
  }
}
