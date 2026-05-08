import { Injectable } from '@nestjs/common';
import { NormalizedMessageDTO } from '../../application/dto/normalized-message.dto';
import { ConversationChannel } from '../../domain/enums/conversation-channel.enum';

/**
 * WhatsApp Adapter (WABA-ready)
 * --------------------------------
 * Converts WhatsApp webhook payload → NormalizedMessageDTO.
 * Handles idempotency and deep metadata extraction for the engine.
 */
@Injectable()
export class WhatsAppAdapter {
  
  /**
   * MAIN ENTRY POINT
   * Converts raw WhatsApp webhook payload → NormalizedMessageDTO
   */
  normalizeIncomingMessage(payload: any): NormalizedMessageDTO {
    const entry = payload?.entry?.[0];
    const value = entry?.changes?.[0]?.value;
    const message = value?.messages?.[0];
    const contact = value?.contacts?.[0];

    if (!message) {
      throw new Error('WhatsAppAdapter: Invalid payload structure or non-message event');
    }

    return new NormalizedMessageDTO({
      messageId: message.id,
      channel: ConversationChannel.WHATSAPP,
      
      // Stable identity = phone number
      userId: message.from, 
      
      // Use the WABA ID from the entry as the default tenant identifier
      tenantId: payload?.tenantId || entry?.id || 'default', 

      content: message.text?.body || '',
      
      // WhatsApp provides Unix timestamps (seconds); JS needs milliseconds
      timestamp: message.timestamp ? Number(message.timestamp) * 1000 : Date.now(),

      metadata: {
        rawPayload: payload,
        phone: message.from,
        profileName: contact?.profile?.name || null,
        messageType: message.type,
        // 🔐 IDEMPOTENCY KEY: WhatsApp message IDs are unique and stable across retries
        idempotencyKey: message.id,
      },
    });
  }

  /**
   * Outbound: Sends a message back to the user via WhatsApp Graph API
   */
  async sendMessage(to: string, text: string): Promise<void> {
    // TODO: Implement Axios/HttpService call to Graph API
    console.log(`[WhatsApp OUTBOUND] To: ${to} | Content: ${text}`);
  }

  /**
   * Helper for logic that needs only the user identity without full normalization
   */
  extractUserId(payload: any): string | null {
    return payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from || null;
  }
}
