// FILE: src/modules/channels/gateway/whatsapp.gateway.ts
// Transport only — routes WebSocket messages into conversation pipeline.

import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ConversationOrchestratorService } from '../../conversation/application/orchestrators/conversation-orchestrator.service';
import { ConversationChannel } from '../../conversation/domain/enums/conversation-channel.enum';
import { WhatsAppSendReplyService } from '../../conversation/infrastructure/adapters/whatsapp/whatsapp-send-reply.service';

interface IncomingSocketPayload {
  phone: string;
  message: string;
  tenantId: string;
  branchId?: string;
}

@WebSocketGateway()
export class WhatsappGateway {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(WhatsappGateway.name);

  constructor(
    private readonly conversationEngine: ConversationOrchestratorService,
    private readonly sendReply: WhatsAppSendReplyService,
  ) {}

  @SubscribeMessage('incomingMessage')
  async handleMessage(
    @MessageBody() payload: IncomingSocketPayload,
    @ConnectedSocket() _client: Socket,
  ) {
    const { phone, message, tenantId, branchId } = payload;

    if (!tenantId) {
      this.logger.warn(`[Gateway] Rejected message from ${phone} — missing tenantId`);
      await this.sendReply.execute({ phone, tenantId: '', userId: phone, message: '❌ Configuration error. Please contact support.' });
      return;
    }

    this.logger.log(`[Gateway] Message from ${phone} | tenant=${tenantId} | text="${message}"`);

    const result = await this.conversationEngine.execute({
      userId:    phone,
      tenantId,
      channel:   ConversationChannel.WHATSAPP,
      message,
      messageId: `ws-${Date.now()}`,
      metadata:  { phone, branchId },
    });

    if (result?.response) {
      await this.sendReply.execute({ phone, tenantId, userId: phone, message: result.response });
    }
  }
}
