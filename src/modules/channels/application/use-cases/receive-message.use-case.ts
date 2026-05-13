// FILE: src/modules/channels/application/use-cases/receive-message.use-case.ts

import { Injectable, Logger } from '@nestjs/common';
import { WhatsAppMessageOrchestratorService } from '../orchestrators/whatsapp-message-orchestrator.service';
import { WhatsAppRateLimitService } from '../services/whatsapp-rate-limit.service';
import { WhatsAppIdempotencyService } from '../services/whatsapp-idempotency.service';

// ✅ ADD THIS
import { OptOutProtectionService } from '@modules/protection/application/services/opt-out-protection.service';

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

  // ==================================================
  // 🚨 GLOBAL OPT-OUT KEYWORDS
  // ==================================================

  private readonly OPT_OUT_KEYWORDS = [
    'stop',
    'unsubscribe',
    'cancel',
    'end',
    'quit',
    'remove me',
    'dont message me',
    "don't message me",
    'block',
  ];

  constructor(
    private readonly orchestrator: WhatsAppMessageOrchestratorService,
    private readonly rateLimit: WhatsAppRateLimitService,
    private readonly idempotency: WhatsAppIdempotencyService,

    // ✅ ADD THIS
    private readonly optOutProtection: OptOutProtectionService,
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
    // 🚨 GLOBAL OPT-OUT DETECTION
    // MUST RUN BEFORE ANY BUSINESS LOGIC
    // ─────────────────────────────────────────────

    const normalizedText = (text || '').trim().toLowerCase();

    const matchedKeyword = this.OPT_OUT_KEYWORDS.find(
      (keyword) => normalizedText === keyword,
    );

    if (matchedKeyword) {
      this.logger.warn(
        `[OPTOUT DETECTED] user=${userId} keyword="${matchedKeyword}"`,
      );

      // 1. Block user globally
      await this.optOutProtection.triggerOptOut({
        tenantId,
        userId,
        reason: 'STOP',
        source: 'whatsapp',
        messageId,
        metadata: {
          phone,
          keyword: matchedKeyword,
        },
      });

      // 2. Mark message processed
      await this.idempotency.markProcessed(messageId, undefined);

      // 3. STOP ALL EXECUTION IMMEDIATELY
      return {
        status: 'opted_out',
      };
    }

    // ─────────────────────────────────────────────
    // 🚫 GLOBAL SUPPRESSION CHECK
    // ─────────────────────────────────────────────

    const suppression = await this.optOutProtection.isOptedOut({
      tenantId,
      userId,
    });

    if (suppression.isOptedOut) {
      this.logger.warn(
        `[WHATSAPP BLOCKED] opted-out user=${userId}`,
      );

      await this.idempotency.markProcessed(messageId, undefined);

      return {
        status: 'blocked_opt_out',
      };
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