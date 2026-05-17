// FILE: src/modules/conversation/application/flows/abandoned-cart.flow.ts

import { Injectable, OnModuleInit } from '@nestjs/common';
import { FlowRegistry, ConversationFlow } from './flow.registry';
import { PipelineContext } from '../pipelines/middleware.pipeline';
import { ContextVaultService } from '../services/context-vault.service';

@Injectable()
export class AbandonedCartFlow implements ConversationFlow, OnModuleInit {
  readonly name = 'abandoned-cart';

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
    const step = ctx.context?.getMemory('flow:abandoned-cart:step') ?? 0;
    const message = ctx.input.message.toLowerCase().trim();
    const userName = this.vault.get(ctx.context!, 'user', 'name') ?? 'there';

    switch (step) {
      case 0: {
        ctx.context?.setMemory('flow:abandoned-cart:step', 1);
        return {
          handled: true,
          response: `Hey ${userName}! 🛒 You left some items in your cart. Ready to complete your order?\n\nReply *yes* to continue or *no* to clear your cart.`,
        };
      }

      case 1: {
        if (message === 'yes' || message.includes('yes') || message.includes('continue')) {
          ctx.context?.setMemory('flow:abandoned-cart:step', null);
          return {
            handled: true,
            response: '✅ Great! Resuming your checkout. Type *checkout* to proceed.',
            endFlow: true,
          };
        }

        if (message === 'no' || message.includes('no') || message.includes('clear')) {
          ctx.context?.setMemory('flow:abandoned-cart:step', null);
          return {
            handled: true,
            response: '🗑️ No problem! Your cart has been cleared. Type *catalog* to start fresh.',
            endFlow: true,
          };
        }

        // Unclear response — re-ask once
        return {
          handled: true,
          response: 'Please reply *yes* to continue checkout or *no* to clear your cart.',
        };
      }

      default:
        return { handled: false };
    }
  }
}
