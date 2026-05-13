// src/modules/whatsapp/application/use-cases/receive-message.use-case.ts

import { Injectable, Logger } from '@nestjs/common';
import { WhatsAppMessageOrchestratorService } from '../orchestrators/whatsapp-message-orchestrator.service';
import { WhatsAppRateLimitService } from '../services/whatsapp-rate-limit.service';
import { WhatsAppIdempotencyService } from '../services/whatsapp-idempotency.service';

export interface ReceiveWhatsAppMessageDTO {
  messageId: string;
  tenantId: string;
  userId: string;
  phone: string;
  text: string;
  timestamp?: number;
}

@Injectable()
export class ReceiveMessageUseCase {
  private readonly logger = new Logger(ReceiveMessageUseCase.name);

  constructor(
    private readonly orchestrator: WhatsAppMessageOrchestratorService,
    private readonly rateLimit: WhatsAppRateLimitService,
    private readonly idempotency: WhatsAppIdempotencyService,
  ) {}

  async execute(dto: ReceiveWhatsAppMessageDTO) {
    const { messageId, tenantId, userId, text, phone } = dto;

    // ─────────────────────────────────────────────
    // 🔐 IDEMPOTENCY GATE (avoid duplicate webhook retries)
    // ─────────────────────────────────────────────
    const alreadyProcessed = await this.idempotency.isProcessed(messageId);
    if (alreadyProcessed) {
      this.logger.warn(
        `[WHATSAPP DUPLICATE] messageId=${messageId} ignored`,
      );
      return { status: 'duplicate_ignored' };
    }

    // ─────────────────────────────────────────────
    // 🚦 RATE LIMIT CHECK (early drop)
    // ─────────────────────────────────────────────
    const allowed = await this.rateLimit.allow(tenantId, userId);

    if (!allowed) {
      this.logger.warn(
        `[WHATSAPP RATE BLOCK] user=${userId} tenant=${tenantId}`,
      );

      await this.idempotency.markProcessed(messageId, undefined);

      return { status: 'rate_limited' };
    }

    // ─────────────────────────────────────────────
    // 🧠 DELEGATE TO ORCHESTRATOR (NO LOGIC HERE)
    // ─────────────────────────────────────────────
    const result = await this.orchestrator.handleIncomingMessage({
      tenantId,
      userId,
      channel: 'whatsapp',
      messageId,
      content: text,
      timestamp: (dto.timestamp ?? new Date().toISOString()) as string,
    });

    // ─────────────────────────────────────────────
    // 💾 STORE IDEMPOTENCY RESULT
    // ─────────────────────────────────────────────
    await this.idempotency.markProcessed(messageId, undefined);

    return {
      status: 'processed',
      result,
    };
  }
}