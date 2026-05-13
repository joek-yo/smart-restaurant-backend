// src/modules/whatsapp/application/orchestrators/whatsapp-message-orchestrator.service.ts

import { Injectable, Logger } from '@nestjs/common';

import { EventBus } from '@core/events/event.bus';
import { CONVERSATION_EVENTS, CHECKOUT_EVENTS } from '@core/events/event.constants';

import { SendReplyUseCase } from '../../handlers/send-reply';

/**
 * WhatsAppMessageOrchestratorService
 * ----------------------------------
 * CENTRAL PIPELINE for all WhatsApp interactions.
 *
 * RULES:
 * - NO business logic
 * - NO session/order ownership
 * - ONLY orchestration + routing
 */

export interface WhatsAppIncomingMessage {
  messageId: string;
  userId: string;
  tenantId: string;
  channel: 'whatsapp';
  content: string;
  timestamp: string;
}

@Injectable()
export class WhatsAppMessageOrchestratorService {
  private readonly logger = new Logger(
    WhatsAppMessageOrchestratorService.name,
  );

  constructor(
    private readonly eventBus: EventBus,
    private readonly sendReply: SendReplyUseCase,
  ) {}

  // ─────────────────────────────────────────────
  // MAIN ENTRY POINT
  // ─────────────────────────────────────────────
  async handleIncomingMessage(message: WhatsAppIncomingMessage) {
    this.logger.log(
      `[WHATSAPP_IN] msg=${message.messageId} user=${message.userId}`,
    );

    // ─────────────────────────────────────────────
    // 1. Normalize payload
    // ─────────────────────────────────────────────
    const normalized = this.normalize(message);

    // ─────────────────────────────────────────────
    // 2. Emit conversation signal
    // (Conversation engine handles ALL logic)
    // ─────────────────────────────────────────────
    this.eventBus.emit(
      CONVERSATION_EVENTS.MESSAGE_RECEIVED,
      normalized,
    );

    // ─────────────────────────────────────────────
    // 3. Optional intent pre-routing hooks (lightweight only)
    // ─────────────────────────────────────────────
    this.handleLightSignals(normalized);

    // ─────────────────────────────────────────────
    // 4. Response will be generated asynchronously
    // via conversation pipeline → then reply is sent
    // ─────────────────────────────────────────────
    return {
      accepted: true,
      messageId: message.messageId,
    };
  }

  // ─────────────────────────────────────────────
  // NORMALIZATION LAYER
  // ─────────────────────────────────────────────
  private normalize(msg: WhatsAppIncomingMessage) {
    return {
      ...msg,
      content: msg.content?.trim(),
      receivedAt: new Date(),
    };
  }

  // ─────────────────────────────────────────────
  // LIGHTWEIGHT SIGNALS ONLY
  // (NO BUSINESS LOGIC HERE)
  // ─────────────────────────────────────────────
  private handleLightSignals(msg: any) {
    const text = msg.content.toLowerCase();

    // UI-level hints only (NOT state changes)
    if (text.includes('checkout')) {
      this.eventBus.emit(
        CHECKOUT_EVENTS.CHECKOUT_STARTED,
        {
          userId: msg.userId,
          tenantId: msg.tenantId,
          source: 'whatsapp',
        },
      );
    }

    if (text.includes('cart')) {
      this.eventBus.emit(
        CONVERSATION_EVENTS.CART_UPDATED,
        {
          userId: msg.userId,
          tenantId: msg.tenantId,
          source: 'whatsapp',
        },
      );
    }
  }
}