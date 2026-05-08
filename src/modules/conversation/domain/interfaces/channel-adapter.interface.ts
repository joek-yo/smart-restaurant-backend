// FILE: src/modules/conversation/domain/interfaces/channel-adapter.interface.ts

import { MessageVO } from '../value-objects/message.vo';
import { ConversationContextEntity } from '../entities/conversation-context.entity';

/**
 * ChannelAdapterInterface
 * ------------------------
 * THIS is what makes the system fully channel-agnostic.
 *
 * WhatsApp, Web, API, SMS → all map into this contract.
 */

export interface ChannelResponse {
  content: string;
  metadata?: Record<string, any>;
}

export interface ChannelAdapterInterface {
  /**
   * Normalize incoming message from ANY channel
   */
  parseIncoming(payload: any): MessageVO;

  /**
   * Format outgoing response for channel delivery
   */
  formatOutgoing(
    response: ChannelResponse,
    context: ConversationContextEntity,
  ): any;

  /**
   * Send message back to channel (WhatsApp/Web/API)
   */
  send(
    response: any,
    context: ConversationContextEntity,
  ): Promise<void>;
}