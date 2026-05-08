import { Injectable } from '@nestjs/common';
import { NormalizedMessageDTO } from '../../application/dto/normalized-message.dto';
import { ConversationChannel } from '../../domain/enums/conversation-channel.enum';

/**
 * Web Chat Adapter
 * -----------------
 * Converts browser-based chat widget payloads into NormalizedMessageDTO.
 * Handles session-to-user mapping and message idempotency.
 */
@Injectable()
export class WebChatAdapter {

  /**
   * MAIN ENTRY POINT
   * Normalizes incoming browser chat payload
   */
  normalizeIncomingMessage(payload: any): NormalizedMessageDTO {
    if (!payload) {
      throw new Error('WebChatAdapter: Invalid payload');
    }

    // Support both 'text' and 'message' keys for flexibility with frontend libs
    const content = payload.text || payload.message;
    if (!content) {
      throw new Error('WebChatAdapter: Message content (text/message) is required');
    }

    // Generate or use existing message ID for idempotency
    const messageId = payload.messageId || this.generateMessageId(payload);

    return new NormalizedMessageDTO({
      messageId,
      channel: ConversationChannel.WEB,

      // Fallback: if user isn't logged in (userId), use sessionId as identity
      userId: payload.userId || payload.sessionId || 'anonymous',
      tenantId: payload.tenantId || 'default',

      content: content,
      timestamp: payload.timestamp || Date.now(),

      metadata: {
        rawPayload: payload,
        sessionId: payload.sessionId || null,
        userAgent: payload.userAgent || payload.browserInfo || null,
        // 🔐 IDEMPOTENCY KEY: Prevents duplicate processing on browser refresh/reconnect
        idempotencyKey: messageId,
      },
    });
  }

  /**
   * Outbound: Sends response back to the frontend (Socket.io/Websocket/SSE)
   */
  async sendMessage(targetId: string, text: string, sessionId?: string): Promise<void> {
    // TODO: Wire to your WebSocket Gateway or SSE Stream
    console.log(`[WEBCHAT OUTBOUND] To: ${targetId} | Session: ${sessionId} | Msg: ${text}`);
  }

  /**
   * 🧠 FALLBACK ID GENERATION
   * Ensures every message has a unique fingerprint if the frontend is "dumb"
   */
  private generateMessageId(payload: any): string {
    const salt = Math.random().toString(36).substr(2, 5);
    return `web_${payload.sessionId || 'anon'}_${Date.now()}_${salt}`;
  }

  /**
   * Helper to resolve identity from raw payload without full DTO conversion
   */
  extractUserId(payload: any): string {
    return payload?.userId || payload?.sessionId || 'anonymous';
  }
}
