// src/modules/conversation/application/services/conversation-engine.service.ts
import { Injectable } from '@nestjs/common';
import { ProcessMessageUseCase } from '../use-cases/process-message.use-case';
import { ProcessMessageDTO } from '../dto/process-message.dto';
import { NormalizedMessageDTO } from '../dto/normalized-message.dto';
import { ConversationChannel } from '../../domain/enums/conversation-channel.enum';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ConversationEngineService {
  constructor(
    private readonly processMessageUseCase: ProcessMessageUseCase,
  ) {}

  async processMessage(dto: {
    userId: string;
    tenantId: string;
    channel: string;
    content: string;
    messageId?: string;
    metadata?: Record<string, any>;
    raw?: any;
  }) {
    const normalizedMessage = new NormalizedMessageDTO({
      tenantId: dto.tenantId,
      userId: dto.userId,
      channel: dto.channel as ConversationChannel,
      content: dto.content,
      messageId: dto.messageId ?? uuidv4(),
      timestamp: new Date(),
      metadata: dto.metadata,
    });

    const processMessageDTO = new ProcessMessageDTO({ message: normalizedMessage });
    return this.processMessageUseCase.execute(processMessageDTO);
  }
}
