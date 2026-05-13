// FILE: src/modules/conversation/presentation/whatsapp.controller.ts

import { Controller, Post, Get, Body, Query, Logger, HttpCode } from '@nestjs/common';
import { MessageRouter } from './gateway/message.router';
import { WhatsAppAdapter } from '../infrastructure/adapters/whatsapp.adapter';

@Controller('webhook/whatsapp')
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);

  constructor(
    private readonly messageRouter: MessageRouter,
    private readonly whatsappAdapter: WhatsAppAdapter,
  ) {}

  @Post()
  @HttpCode(200)
  async handleIncomingMessage(@Body() payload: any) {
    const hasMessage = payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!hasMessage) {
      this.logger.debug('[WEBHOOK] Non-message event — acknowledged');
      return { status: 'ignored' };
    }

    let normalized: ReturnType<WhatsAppAdapter['normalizeIncomingMessage']>;
    try {
      normalized = this.whatsappAdapter.normalizeIncomingMessage(payload);
    } catch (err: any) {
      this.logger.warn(`[WEBHOOK] Normalization failed: ${err.message}`);
      return { status: 'ignored', reason: err.message };
    }

    this.logger.log(`[WEBHOOK] Message from ${normalized.userId} | id: ${normalized.messageId}`);

    const result = await this.messageRouter.routeWhatsApp({
      userId: normalized.userId,
      tenantId: normalized.tenantId,
      message: normalized.content,
      messageId: normalized.messageId,
      metadata: normalized.metadata,
    });

    if (result?.response && normalized.metadata?.phone) {
      await this.whatsappAdapter.sendMessage(normalized.metadata.phone, result.response);
    }

    return { status: 'ok', idempotent: result?.idempotent ?? false };
  }

  @Get('verify')
  @HttpCode(200)
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'default_token';
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      this.logger.log('[WEBHOOK] Verification successful');
      return parseInt(challenge, 10);
    }
    this.logger.warn('[WEBHOOK] Verification failed — token mismatch');
    return { status: 'forbidden' };
  }
}
