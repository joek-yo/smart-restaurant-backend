// src/modules/smartpage/infrastructure/adapters/conversation.adapter.ts

import { Injectable, Logger } from '@nestjs/common';

import { ConversationState } from '@modules/conversation/domain/enums/conversation-state.enum';

/**
 * ConversationAdapter
 * ------------------------------------------------------
 * Bridge between SmartPage Engine and Conversation Engine.
 *
 * Purpose:
 * - Expose conversation state to SmartPage
 * - Enable intent-aware rendering
 * - Drive UI changes based on dialogue flow
 *
 * Examples:
 * - "user is browsing" → show catalog blocks
 * - "user is in checkout" → show checkout blocks
 * - "user is recovering session" → show recovery banners
 *
 * IMPORTANT:
 * This must remain a thin integration layer.
 * NO business logic.
 */

export interface ConversationSnapshot {
  userId: string;
  tenantId: string;
  sessionId?: string;

  state: ConversationState;

  lastIntent?: string;
  lastMessage?: string;

  isInRecovery: boolean;

  metadata?: Record<string, any>;
}

@Injectable()
export class ConversationAdapter {
  private readonly logger = new Logger(ConversationAdapter.name);

  // ======================================================
  // 💬 GET CONVERSATION SNAPSHOT
  // ======================================================
  async getConversationSnapshot(input: {
    tenantId: string;
    userId: string;
    sessionId?: string;
  }): Promise<ConversationSnapshot | null> {
    try {
      /**
       * REAL IMPLEMENTATION TARGET:
       * - ConversationContextEntity (domain layer)
       * - StateMachineService
       * - ConversationProtectionService
       */

      // Placeholder safe structure (to be replaced with real domain calls)
      const snapshot: ConversationSnapshot = {
        tenantId: input.tenantId,
        userId: input.userId,
        sessionId: input.sessionId,

        state: ConversationState.IDLE,

        lastIntent: undefined,
        lastMessage: undefined,

        isInRecovery: false,

        metadata: {},
      };

      this.logger.debug(
        `[ConversationAdapter] snapshot fetched user=${input.userId}`,
      );

      return snapshot;
    } catch (error) {
      this.logger.error(
        `[ConversationAdapter] failed to fetch snapshot`,
        error instanceof Error ? error.stack : String(error),
      );

      return null;
    }
  }

  // ======================================================
  // 🧠 GET CURRENT CONVERSATION STATE
  // ======================================================
  async getState(input: {
    tenantId: string;
    userId: string;
  }): Promise<ConversationState> {
    const snapshot = await this.getConversationSnapshot(input);

    return snapshot?.state ?? ConversationState.IDLE;
  }

  // ======================================================
  // 🔍 CHECK IF USER IS IN RECOVERY FLOW
  // ======================================================
  async isInRecovery(input: {
    tenantId: string;
    userId: string;
  }): Promise<boolean> {
    const snapshot = await this.getConversationSnapshot(input);

    return snapshot?.isInRecovery ?? false;
  }

  // ======================================================
  // 💡 GET LAST INTENT (FOR SMARTPAGE DECISIONING)
  // ======================================================
  async getLastIntent(input: {
    tenantId: string;
    userId: string;
  }): Promise<string | undefined> {
    const snapshot = await this.getConversationSnapshot(input);

    return snapshot?.lastIntent;
  }

  // ======================================================
  // 🧾 GET LAST MESSAGE (FOR CONTEXTUAL UI)
  // ======================================================
  async getLastMessage(input: {
    tenantId: string;
    userId: string;
  }): Promise<string | undefined> {
    const snapshot = await this.getConversationSnapshot(input);

    return snapshot?.lastMessage;
  }
}