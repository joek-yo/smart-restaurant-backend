import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConversationIntent } from '../../domain/enums/conversation-intent.enum';

export interface IntentResolver {
  readonly name: string;
  readonly priority: number;
  resolve(message: string, context?: any): ConversationIntent | null;
}

@Injectable()
export class ResolverRegistry implements OnApplicationBootstrap {
  private readonly logger = new Logger(ResolverRegistry.name);
  private resolvers: IntentResolver[] = [];

  // Runs AFTER all onModuleInit hooks — sort and summarize here
  onApplicationBootstrap() {
    this.resolvers.sort((a, b) => a.priority - b.priority);
    this.logger.log(
      `[ResolverRegistry] ${this.resolvers.length} resolvers ready: ` +
        this.resolvers.map((r) => `${r.name}(p=${r.priority})`).join(', '),
    );
  }

  register(resolver: IntentResolver): void {
    this.resolvers.push(resolver);
    this.logger.log(`[ResolverRegistry] registered: ${resolver.name}`);
  }

  resolveIntent(message: string, context?: any): ConversationIntent {
    for (const resolver of this.resolvers) {
      const intent = resolver.resolve(message, context);
      if (intent !== null && intent !== undefined) {
        this.logger.debug(`[ResolverRegistry] ${resolver.name} → ${intent}`);
        return intent;
      }
    }
    return ConversationIntent.UNKNOWN;
  }

  getAll(): IntentResolver[] {
    return [...this.resolvers];
  }
}
