// src/modules/conversation/presentation/webchat.controller.ts

import { Controller, Post, Body } from '@nestjs/common';
import { ConversationEngineService } from '../application/services/conversation-engine.service';
import { ConversationChannel } from '../domain/enums/conversation-channel.enum';

/**
 * WebChat Controller (Future UI / SaaS Widget Entry Point)
 * --------------------------------------------------------
 * This is the browser / frontend entry point for conversations.
 *
 * Examples:
 * - Embedded chat widget on websites
 * - Admin dashboard chat
 * - SaaS customer portal
 *
 * IMPORTANT:
 * - No business logic here
 * - No state handling here
 * - No cart/session logic here
 * Everything goes to Conversation Engine
 */

@Controller('api/conversation/webchat')
export class WebChatController {
  constructor(
    private readonly conversationEngine: ConversationEngineService,
  ) {}

  /**
   * Handles incoming messages from web chat UI
   */
  @Post('message')
  async handleMessage(@Body() body: any) {
    // -------------------------------------------------
    // 1. Normalize web chat payload
    // -------------------------------------------------
    const normalizedMessage = {
      userId: body.userId,
      tenantId: body.tenantId,
      channel: ConversationChannel.WEB,
      content: body.message,
      raw: body,
    };

    // -------------------------------------------------
    // 2. Send to Conversation Engine (single brain)
    // -------------------------------------------------
    const result = await this.conversationEngine.processMessage(
      normalizedMessage,
    );

    // -------------------------------------------------
    // 3. Return engine response
    // -------------------------------------------------
    return {
      success: true,
      data: result,
    };
  }
}