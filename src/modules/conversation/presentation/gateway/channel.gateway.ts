// FILE: src/modules/conversation/presentation/gateway/channel.gateway.ts

import { Injectable, Logger } from '@nestjs/common';
import { ProcessMessageUseCase } from '../../application/use-cases/process-message.use-case';
import { ProcessMessageDTO } from '../../application/dto/process-message.dto';
import { NormalizedMessageDTO } from '../../application/dto/normalized-message.dto';
import { ConversationChannel } from '../../domain/enums/conversation-channel.enum';
import { v4 as uuidv4 } from 'uuid';

export interface ChannelMessage {
  tenantId: string;
  userId: string;
  message: string;
  channel: 'whatsapp' | 'webchat' | 'api' | string;
  messageId?: string;
  metadata?: Record<string, any>;
}

export interface ChannelResponse {
  success: boolean;
  response: string;
  state: string;
  intent: string;
  events: string[];
  idempotent?: boolean;
}

@Injectable()
export class ChannelGateway {
  private readonly logger = new Logger(ChannelGateway.name);

  constructor(
    private readonly processMessage: ProcessMessageUseCase,
  ) {}

  async receive(msg: ChannelMessage): Promise<ChannelResponse> {
    this.logger.log(
      `[ChannelGateway] ← ${msg.channel} | tenant=${msg.tenantId} user=${msg.userId}`,
    );

    const normalized = new NormalizedMessageDTO({
      tenantId: msg.tenantId,
      userId: msg.userId,
      channel: msg.channel as ConversationChannel,
      content: msg.message,
      messageId: msg.messageId ?? uuidv4(),
      metadata: msg.metadata,
    });

    const dto = new ProcessMessageDTO({ message: normalized });
    const result = await this.processMessage.execute(dto);

    this.logger.log(
      `[ChannelGateway] → intent=${result.intent} state=${result.state} idempotent=${result.idempotent ?? false}`,
    );

    return {
      success: true,
      response: result.response,
      state: result.state,
      intent: result.intent,
      events: result.events,
      idempotent: result.idempotent,
    };
  }
}
