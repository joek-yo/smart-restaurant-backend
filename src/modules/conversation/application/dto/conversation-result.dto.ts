// FILE: src/modules/conversation/application/dto/conversation-result.dto.ts

import { ConversationStateEnum } from '../../domain/enums/conversation-state.enum';
import { ConversationIntentEnum } from '../../domain/enums/conversation-intent.enum';

/**
 * ConversationResultDTO
 * ----------------------
 * Output of the Conversation Engine after processing a message.
 *
 * This is what adapters (WhatsApp/Web/API) will consume.
 */

export class ConversationResultDTO {
  readonly userId: string;
  readonly tenantId: string;

  readonly response: string;

  readonly state: ConversationStateEnum;

  readonly intent: ConversationIntentEnum;

  /**
   * Optional structured payload for channels
   */
  readonly metadata?: Record<string, any>;

  /**
   * Optional events emitted by engine
   */
  readonly events?: Array<{
    name: string;
    payload: any;
  }>;

  constructor(params: {
    userId: string;
    tenantId: string;
    response: string;
    state: ConversationStateEnum;
    intent: ConversationIntentEnum;
    metadata?: Record<string, any>;
    events?: Array<{
      name: string;
      payload: any;
    }>;
  }) {
    this.userId = params.userId;
    this.tenantId = params.tenantId;

    this.response = params.response;

    this.state = params.state;
    this.intent = params.intent;

    this.metadata = params.metadata;
    this.events = params.events;
  }
}