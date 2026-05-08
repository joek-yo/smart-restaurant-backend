// FILE: src/modules/conversation/application/dto/process-message.dto.ts

import { NormalizedMessageDTO } from './normalized-message.dto';
import { ConversationContextEntity } from '../../domain/entities/conversation-context.entity';

/**
 * ProcessMessageDTO
 * ------------------
 * Input contract for the Conversation Engine (core brain entry point)
 */

export class ProcessMessageDTO {
  readonly message: NormalizedMessageDTO;

  /**
   * Optional preloaded context (from Redis)
   */
  readonly context?: ConversationContextEntity;

  constructor(params: {
    message: NormalizedMessageDTO;
    context?: ConversationContextEntity;
  }) {
    this.message = params.message;
    this.context = params.context;
  }
}