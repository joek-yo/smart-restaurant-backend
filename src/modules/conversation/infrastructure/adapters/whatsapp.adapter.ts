// FILE: src/modules/conversation/infrastructure/adapters/whatsapp.adapter.ts

import { Injectable } from '@nestjs/common';
import { NormalizedMessageDTO } from '../../application/dto/normalized-message.dto';
import { ConversationChannel } from '../../domain/enums/conversation-channel.enum';
import { WhatsAppDeliveryService } from './whatsapp/whatsapp-delivery.service';

@Injectable()
export class WhatsAppAdapter {

  constructor(private readonly delivery: WhatsAppDeliveryService) {}

  normalizeIncomingMessage(payload: any): NormalizedMessageDTO {
    const entry   = payload?.entry?.[0];
    const value   = entry?.changes?.[0]?.value;
    const message = value?.messages?.[0];
    const contact = value?.contacts?.[0];

    if (!message) {
      throw new Error('WhatsAppAdapter: Invalid payload structure or non-message event');
    }

    return new NormalizedMessageDTO({
      messageId:  message.id,
      channel:    ConversationChannel.WHATSAPP,
      userId:     message.from,
      tenantId:   payload?.tenantId || entry?.id || 'default',
      content:    message.text?.body || '',
      timestamp:  message.timestamp ? Number(message.timestamp) * 1000 : Date.now(),
      metadata: {
        rawPayload:     payload,
        phone:          message.from,
        profileName:    contact?.profile?.name || null,
        messageType:    message.type,
        idempotencyKey: message.id,
      },
    });
  }

  async sendMessage(to: string, text: string, tenantId = 'default'): Promise<void> {
    await this.delivery.send({ to, message: text, tenantId });
  }

  extractUserId(payload: any): string | null {
    return payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from || null;
  }
}
