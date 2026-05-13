// src/modules/conversation/application/use-cases/recover-conversation.use-case.ts

import { Injectable } from '@nestjs/common';
import { LoadContextUseCase } from './load-context.use-case';
import { ConversationContextEntity } from '../../domain/entities/conversation-context.entity';
import { ConversationState } from '../../domain/enums/conversation-state.enum';

@Injectable()
export class RecoverConversationUseCase {
  constructor(
    private readonly loadContext: LoadContextUseCase,
  ) {}

  /**
   * =====================================================
   * RECOVERY ENGINE
   * =====================================================
   */
  async execute(input: {
    tenantId: string;
    userId: string;
    channel: string;
    message: string;
    metadata?: {
      isRetry?: boolean;
      isReconnect?: boolean;
      isTimeout?: boolean;
    };
  }): Promise<{
    context: ConversationContextEntity;
    recovered: boolean;
  }> {

    // ─────────────────────────────────────────────
    // 1. LOAD EXISTING CONTEXT
    // ─────────────────────────────────────────────
    const context = await this.loadContext.execute({
      tenantId: input.tenantId,
      userId: input.userId,
      channel: input.channel,
    });

    let recovered = false;

    // ─────────────────────────────────────────────
    // 2. DETECT RECOVERY CONDITIONS
    // ─────────────────────────────────────────────
    const isAbandoned =
      context.state === ConversationState.ABANDONED ||
      context.state === ConversationState.STARTED;

    const isRetry = input.metadata?.isRetry === true;
    const isReconnect = input.metadata?.isReconnect === true;
    const isTimeout = input.metadata?.isTimeout === true;

    // ─────────────────────────────────────────────
    // 3. RECOVERY STRATEGY
    // ─────────────────────────────────────────────

    if (isRetry || isReconnect || isTimeout || isAbandoned) {
      recovered = true;

      // restore safe fallback state
      context.markRecovery(
        context.state,
        isRetry
          ? 'message_retry'
          : isReconnect
          ? 'reconnect'
          : isTimeout
          ? 'timeout'
          : 'abandoned',
      );

      // bring user back to safe interaction state
      if (
        context.state === ConversationState.ABANDONED ||
        context.state === ConversationState.STARTED
      ) {
        context.updateState(ConversationState.BROWSING);
      }

      // optional: restore memory hints
      context.setMemory('recovered', true);
      context.setMemory('recoveryTimestamp', new Date().toISOString());
    }

    // ─────────────────────────────────────────────
    // 4. RETURN RECOVERY RESULT
    // ─────────────────────────────────────────────
    return {
      context,
      recovered,
    };
  }
}
