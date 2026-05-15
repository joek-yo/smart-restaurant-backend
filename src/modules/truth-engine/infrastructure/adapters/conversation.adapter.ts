// FILE: src/modules/truth-engine/infrastructure/adapters/conversation.adapter.ts

import { Injectable } from '@nestjs/common';
import { ContextVaultService } from '@modules/conversation/application/services/context-vault.service';
import { ConversationContextEntity } from '@modules/conversation/domain/entities/conversation-context.entity';

/**
 * ConversationAdapter
 * -------------------
 * Truth Engine boundary adapter for Conversation data.
 *
 * Responsibilities:
 * - Read conversation state + memory via ContextVaultService
 * - Provide intent-related signals for Truth Engine snapshot
 * - Keep conversation domain fully isolated from Truth Engine logic
 *
 * IMPORTANT RULES:
 * - NO intent classification here
 * - NO AI calls
 * - NO derived computation
 * - READ-ONLY access to conversation memory/state
 */
@Injectable()
export class ConversationAdapter {
  constructor(
    private readonly contextVault: ContextVaultService,
  ) {}

  /**
   * Extract a compact conversation snapshot for Truth Engine
   */
  async fetch(input: { tenantId: string; userId: string }): Promise<any> {
    return null;
  }

  snapshot(context: ConversationContextEntity) {
    return {
      state: context.state,
      memory: context.memory,
      pendingPrompt: (context as any).pendingPrompt,
      recoveryMarker: (context as any).recoveryMarker,
    };
  }

  /**
   * Read a compact AI-safe memory view (used in prompts later)
   */
  aiSnapshot(context: ConversationContextEntity): string {
    return this.contextVault.snapshot(context);
  }

  /**
   * Extract raw namespace memory (debug / advanced usage)
   */
  getNamespace(
    context: ConversationContextEntity,
    namespace: 'user' | 'flow' | 'ai' | 'commerce' | 'system',
  ) {
    return this.contextVault.getNamespace(context, namespace);
  }
}