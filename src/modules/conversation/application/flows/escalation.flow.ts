// FILE: src/modules/conversation/application/flows/escalation.flow.ts

import { Injectable, OnModuleInit } from '@nestjs/common';
import { FlowRegistry, ConversationFlow } from './flow.registry';
import { PipelineContext } from '../pipelines/middleware.pipeline';
import { ContextVaultService } from '../services/context-vault.service';

@Injectable()
export class EscalationFlow implements ConversationFlow, OnModuleInit {
  readonly name = 'escalation';

  constructor(
    private readonly registry: FlowRegistry,
    private readonly vault: ContextVaultService,
  ) {}

  onModuleInit() {
    this.registry.register(this);
  }

  async execute(ctx: PipelineContext): Promise<{
    handled: boolean;
    response?: string;
    nextFlow?: string;
    endFlow?: boolean;
  }> {
    const step = ctx.context?.getMemory('flow:escalation:step') ?? 0;
    const message = ctx.input.message.toLowerCase().trim();
    const userName = this.vault.get(ctx.context!, 'user', 'name') ?? 'there';

    switch (step) {
      case 0: {
        ctx.context?.setMemory('flow:escalation:step', 1);
        // Track escalation count
        const count = (ctx.context?.getMemory('flow:escalation:count') ?? 0) + 1;
        ctx.context?.setMemory('flow:escalation:count', count);

        return {
          handled: true,
          response: `Sorry to hear that, ${userName} 😔 I'd like to connect you with a human agent.\n\nCan you briefly describe the issue? (or type *skip* to connect directly)`,
        };
      }

      case 1: {
        ctx.context?.setMemory('flow:escalation:step', null);

        const issue = message === 'skip' ? 'Not specified' : ctx.input.message.trim();
        await this.vault.set(ctx.context!, 'system', 'escalationIssue', issue);
        await this.vault.set(ctx.context!, 'system', 'escalatedAt', new Date().toISOString());

        return {
          handled: true,
          response: `✅ Got it! I've noted your issue and flagged this conversation for a human agent.\n\nIssue: "${issue}"\n\nSomeone will follow up with you shortly. Thank you for your patience 🙏`,
          endFlow: true,
        };
      }

      default:
        return { handled: false };
    }
  }
}
