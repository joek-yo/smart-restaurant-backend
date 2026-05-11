// src/modules/whatsapp/gateway/whatsapp.gateway.ts
//
// ✅ FIX 3 — Gateway now routes ALL messages through ConversationEngineService.
// No direct cart/checkout use-case calls here.
// Engine handles: intent → state machine → commerce command → session mutation.

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ConversationEngineService } from '../../conversation/application/services/conversation-engine.service';
import { ConversationChannel } from '../../conversation/domain/enums/conversation-channel.enum';
import { SendReplyUseCase } from '../handlers/send-reply';

interface IncomingSocketPayload {
  phone: string;
  message: string;
  tenantId: string;      // ✅ FIX 4: tenantId required from client
  branchId?: string;
}

@WebSocketGateway()
export class WhatsappGateway {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(WhatsappGateway.name);

  constructor(
    // ✅ Only the conversation engine — no direct session/cart dependencies
    private readonly conversationEngine: ConversationEngineService,
    private readonly sendReply: SendReplyUseCase,
  ) {}

  @SubscribeMessage('incomingMessage')
  async handleMessage(
    @MessageBody() payload: IncomingSocketPayload,
    @ConnectedSocket() _client: Socket,
  ) {
    const { phone, message, tenantId, branchId } = payload;

    if (!tenantId) {
      this.logger.warn(`[Gateway] Rejected message from ${phone} — missing tenantId`);
      return this.sendReply.execute(phone, '❌ Configuration error. Please contact support.');
    }

    this.logger.log(`[Gateway] Message from ${phone} | tenant=${tenantId} | text="${message}"`);

    // ── Route through conversation engine (state machine + orchestration) ──
    const result = await this.conversationEngine.processMessage({
      userId: phone,
      tenantId,
      channel: ConversationChannel.WHATSAPP,
      content: message,
      messageId: `ws-${Date.now()}`,
      metadata: { phone, branchId },
    });

    if (result?.response) {
      return this.sendReply.execute(phone, result.response);
    }
  }
}