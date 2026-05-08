import { ConversationChannel } from '../../domain/enums/conversation-channel.enum';

/**
 * NormalizedMessageDTO
 * ---------------------
 * Standardized inbound message format across ALL channels.
 * This is the FIRST clean abstraction after raw channel input.
 */
export class NormalizedMessageDTO {
  public readonly tenantId: string;
  public readonly userId: string;
  public readonly channel: ConversationChannel;
  public readonly content: string;
  public readonly messageId: string;
  public readonly timestamp: Date;
  public readonly metadata?: {
    rawPayload?: any;
    phone?: string;
    email?: string;
    sessionId?: string;
  };

  constructor(params: {
    tenantId: string;
    userId: string;
    channel: ConversationChannel;
    content: string;
    messageId: string;
    timestamp?: Date | number;
    metadata?: any;
  }) {
    this.tenantId = params.tenantId;
    this.userId = params.userId;
    this.channel = params.channel;
    this.content = params.content;
    this.messageId = params.messageId;
    
    // Handle both Date objects and Unix timestamps
    this.timestamp = params.timestamp instanceof Date 
      ? params.timestamp 
      : params.timestamp 
        ? new Date(params.timestamp) 
        : new Date();

    this.metadata = params.metadata;

    this.validate();
  }

  private validate(): void {
    if (!this.tenantId) throw new Error('NormalizedMessageDTO: tenantId required');
    if (!this.userId) throw new Error('NormalizedMessageDTO: userId required');
    if (!this.messageId) throw new Error('NormalizedMessageDTO: messageId required');
    if (!this.content || this.content.trim().length === 0) {
      throw new Error('NormalizedMessageDTO: content cannot be empty');
    }
  }
}
