import { Injectable } from '@nestjs/common';
import { NormalizedMessageDTO } from '../../application/dto/normalized-message.dto';
import { ConversationChannel } from '../../domain/enums/conversation-channel.enum';

/**
 * API Adapter
 * -----------
 * Handles input from SDKs, external integrations, mobile apps, or headless bots.
 * Focuses on identity mapping and idempotency for external system retries.
 */
@Injectable()
export class ApiAdapter {

  /**
   * MAIN ENTRY POINT
   * Converts external API payload → NormalizedMessageDTO
   */
  normalizeIncomingMessage(payload: any): NormalizedMessageDTO {
    if (!payload) {
      throw new Error('ApiAdapter: Invalid payload');
    }

    // Support both 'text' and 'message' keys for broad integration support
    const content = payload.text || payload.message;
    if (!content) {
      throw new Error('ApiAdapter: content (text/message) is required');
    }

    const messageId = payload.messageId || this.generateMessageId(payload);

    return new NormalizedMessageDTO({
      messageId,
      channel: ConversationChannel.API,

      userId: this.resolveUserId(payload),
      tenantId: payload.tenantId || 'default',

      content: content,
      timestamp: payload.timestamp || Date.now(),

      metadata: {
        rawPayload: payload,
        source: payload.source || 'external_api',
        authType: payload.authType || 'api_key',
        // 🔐 IDEMPOTENCY KEY: Essential for external systems that might retry on timeout
        idempotencyKey: messageId,
      },
    });
  }

  /**
   * Outbound: Sends response back to the calling system (Webhook/Callback)
   */
  async sendMessage(userId: string, text: string): Promise<void> {
    // In a headless API context, this usually logs or triggers a callback URL
    console.log(`[API OUTBOUND] Target User: ${userId} | Content: ${text}`);
  }

  /**
   * 🔐 USER RESOLUTION LOGIC
   * Maps external identity types to a stable internal string
   */
  private resolveUserId(payload: any): string {
    if (payload.userId) return payload.userId;
    
    // Fallback to client identifier for machine-to-machine integrations
    if (payload.clientId) return `client_${payload.clientId}`;

    return `api_anon_${Date.now()}`;
  }

  /**
   * 🧠 FALLBACK MESSAGE ID GENERATION
   */
  private generateMessageId(payload: any): string {
    const context = payload.clientId || 'anon';
    return `api_${context}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  }
}
