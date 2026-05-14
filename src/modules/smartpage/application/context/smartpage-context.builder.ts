// src/modules/smartpage/application/context/smartpage-context.builder.ts

import { Injectable, Logger } from '@nestjs/common';

import { UserContextService } from './user-context.service';
import { BusinessContextService } from './business-context.service';

// import { ConversationContextRepository } from '@modules/conversation/domain/repositories/conversation-context.repository'; // missing
// import { SessionRepository } from '@modules/session/domain/repositories/session.repository'; // missing

/**
 * SmartPageContextBuilder
 * -----------------------
 * Builds ONE unified context for rendering SmartPages.
 *
 * This is the "brain input layer" of the SmartPage engine.
 */
@Injectable()
export class SmartPageContextBuilder {
  private readonly logger = new Logger(SmartPageContextBuilder.name);

  constructor(
    private readonly userContextService: UserContextService,
    private readonly businessContextService: BusinessContextService,
    private readonly conversationRepo: any,
    private readonly sessionRepo: any,
  ) {}

  /**
   * MAIN ENTRY
   */
  async build(input: {
    tenantId: string;
    userId: string;
    sessionId: string;
    channel: string;
  }) {
    // ==================================================
    // 1. LOAD BUSINESS CONTEXT (TENANT BRAIN)
    // ==================================================
    const businessContext =
      await this.businessContextService.buildBusinessContext({
        tenantId: input.tenantId,
      });

    // ==================================================
    // 2. LOAD USER CONTEXT (BEHAVIORAL BRAIN)
    // ==================================================
    const userContext =
      await (this.userContextService as any).buildUserContext?.({
        tenantId: input.tenantId,
        userId: input.userId,
      });

    // ==================================================
    // 3. LOAD CONVERSATION CONTEXT (STATE MACHINE BRAIN)
    // ==================================================
    const conversation =
      await this.conversationRepo.findByUser(
        input.tenantId,
        input.userId,
      );

    // ==================================================
    // 4. LOAD SESSION CONTEXT (SESSION + CART STATE)
    // ==================================================
    const session = await this.sessionRepo.findById(
      input.sessionId,
    );

    // ==================================================
    // 5. BUILD CANONICAL SMARTPAGE CONTEXT
    // ==================================================
    const smartpageContext = {
      // ------------------------------
      // IDENTIFIERS
      // ------------------------------
      tenantId: input.tenantId,
      userId: input.userId,
      sessionId: input.sessionId,
      channel: input.channel,

      // ------------------------------
      // BUSINESS BRAIN
      // ------------------------------
      business: businessContext,

      // ------------------------------
      // USER BRAIN
      // ------------------------------
      user: userContext,

      // ------------------------------
      // CONVERSATION BRAIN
      // ------------------------------
      conversation: conversation
        ? {
            state: conversation.state,
            memory: conversation.memory,
            pendingPrompt: conversation.pendingPrompt,
            recoveryMarker: conversation.recoveryMarker,
          }
        : null,

      // ------------------------------
      // SESSION BRAIN
      // ------------------------------
      session: session
        ? {
            id: session.id,
            cart: session.cart,
            metadata: session.metadata,
            lastActivity: session.updatedAt,
          }
        : null,

      // ------------------------------
      // DEVICE CONTEXT (DERIVED)
      // ------------------------------
      device: this.resolveDevice(input.channel),

      // ------------------------------
      // RAW DEBUG PAYLOAD (OPTIONAL)
      // ------------------------------
      _meta: {
        builtAt: new Date(),
        hasConversation: !!conversation,
        hasSession: !!session,
        hasUserContext: !!userContext,
        hasBusinessContext: !!businessContext,
      },
    };

    // ==================================================
    // LOG CONTEXT BUILD (DEBUG + OBSERVABILITY)
    // ==================================================
    this.logger.log(
      `[SmartPageContext] built tenant=${input.tenantId} user=${input.userId}`,
    );

    return smartpageContext;
  }

  /**
   * CHANNEL → DEVICE MAPPING
   */
  private resolveDevice(channel: string) {
    switch (channel) {
      case 'whatsapp':
      case 'sms':
        return 'mobile';

      case 'web':
        return 'desktop';

      case 'instagram':
        return 'mobile';

      default:
        return 'unknown';
    }
  }
}