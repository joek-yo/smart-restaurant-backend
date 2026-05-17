// FILE: src/modules/conversation/application/flows/onboarding.flow.ts

import { Injectable, OnModuleInit } from '@nestjs/common';
import { FlowRegistry, ConversationFlow } from './flow.registry';
import { PipelineContext } from '../pipelines/middleware.pipeline';
import { ContextVaultService } from '../services/context-vault.service';

@Injectable()
export class OnboardingFlow implements ConversationFlow, OnModuleInit {
  readonly name = 'onboarding';

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
    const step = ctx.context?.getMemory('flow:onboarding:step') ?? 0;
    const message = ctx.input.message.toLowerCase().trim();

    switch (step) {
      case 0: {
        // First touch — greet and ask for name
        ctx.context?.setMemory('flow:onboarding:step', 1);
        return {
          handled: true,
          response: "👋 Welcome! I'm your shopping assistant. What's your name?",
        };
      }

      case 1: {
        // Capture name
        const name = ctx.input.message.trim().split(' ')[0];
        await this.vault.set(ctx.context!, 'user', 'name', name);
        ctx.context?.setMemory('flow:onboarding:step', 2);
        return {
          handled: true,
          response: `Nice to meet you, ${name}! 🎉 Would you like to:\n1️⃣ Browse products\n2️⃣ View offers\n3️⃣ Get help`,
        };
      }

      case 2: {
        // Handle menu choice
        ctx.context?.setMemory('flow:onboarding:step', null);
        if (message.includes('1') || message.includes('browse') || message.includes('product')) {
          return { handled: true, response: '🛍️ Great! Type *catalog* to see our products.', endFlow: true };
        }
        if (message.includes('2') || message.includes('offer')) {
          return { handled: true, response: '🎁 Check out our latest deals at /products?featured=true', endFlow: true };
        }
        return { handled: true, response: "I'm here to help! Ask me anything about our products or your order.", endFlow: true };
      }

      default:
        return { handled: false };
    }
  }
}
