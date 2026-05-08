// src/modules/conversation/presentation/api.controller.ts

import { Controller, Post, Body, Headers } from '@nestjs/common';
import { ConversationEngineService } from '../application/services/conversation-engine.service';
import { ConversationChannel } from '../domain/enums/conversation-channel.enum';

/**
 * API Controller (Developer / Integration Entry Point)
 * -----------------------------------------------------
 * This endpoint is used by:
 * - Mobile apps
 * - External SaaS integrations
 * - Internal services
 * - API clients / SDKs
 *
 * IMPORTANT:
 * - No business logic here
 * - No state logic here
 * - No direct module coupling
 * Everything flows into Conversation Engine
 */

@Controller('api/conversation')
export class ApiController {
  constructor(
    private readonly conversationEngine: ConversationEngineService,
  ) {}

  /**
   * Generic API message entry point
   * Used by external systems (SDKs, integrations, apps)
   */
  @Post('message')
  async handleMessage(
    @Body() body: any,
    @Headers() headers: Record<string, any>,
  ) {
    // -------------------------------------------------
    // 1. Normalize API request into engine format
    // -------------------------------------------------
    const normalizedMessage = {
      userId: body.userId,
      tenantId: body.tenantId || headers['x-tenant-id'],
      channel: ConversationChannel.API,
      content: body.message,
      metadata: {
        source: 'api',
        headers,
      },
      raw: body,
    };

    // -------------------------------------------------
    // 2. Forward to Conversation Engine (single brain)
    // -------------------------------------------------
    const result = await this.conversationEngine.processMessage(
      normalizedMessage,
    );

    // -------------------------------------------------
    // 3. Return structured response for API consumers
    // -------------------------------------------------
    return {
      success: true,
      data: result,
    };
  }
}