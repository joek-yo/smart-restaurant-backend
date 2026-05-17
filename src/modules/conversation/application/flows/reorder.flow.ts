// FILE: src/modules/conversation/application/flows/reorder.flow.ts

import { Injectable, OnModuleInit } from '@nestjs/common';
import { FlowRegistry, ConversationFlow } from './flow.registry';
import { PipelineContext } from '../pipelines/middleware.pipeline';
import { ContextVaultService } from '../services/context-vault.service';

@Injectable()
export class ReorderFlow implements ConversationFlow, OnModuleInit {
  readonly name = 'reorder';

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
    const step = ctx.context?.getMemory('flow:reorder:step') ?? 0;
    const message = ctx.input.message.toLowerCase().trim();
    const userName = this.vault.get(ctx.context!, 'user', 'name') ?? 'there';
    const lastOrder = this.vault.get(ctx.context!, 'commerce', 'lastOrderId');

    switch (step) {
      case 0: {
        if (!lastOrder) {
          return {
            handled: true,
            response: "I couldn't find a previous order to reorder. Type *catalog* to browse products.",
            endFlow: true,
          };
        }

        ctx.context?.setMemory('flow:reorder:step', 1);
        return {
          handled: true,
          response: `Hi ${userName}! 🔄 Want to reorder your last order (#${lastOrder})?\n\nReply *yes* to reorder or *no* to cancel.`,
        };
      }

      case 1: {
        ctx.context?.setMemory('flow:reorder:step', null);

        if (message.includes('yes')) {
          return {
            handled: true,
            response: `✅ Reordering #${lastOrder}! We'll add the same items to your cart. Type *checkout* to complete.`,
            endFlow: true,
          };
        }

        return {
          handled: true,
          response: '👍 No problem! Type *catalog* to browse something new.',
          endFlow: true,
        };
      }

      default:
        return { handled: false };
    }
  }
}
