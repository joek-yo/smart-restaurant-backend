import { ConversationChannel } from '../enums/conversation-channel.enum';

/**
 * MessageVO
 * ----------
 * Normalized inbound/outbound message structure.
 * Channel-agnostic core message abstraction.
 */
export class MessageVO {
  constructor(
    public readonly tenantId: string,
    public readonly userId: string,
    public readonly content: string,
    public readonly channel: ConversationChannel,
    public readonly timestamp: Date = new Date(),
    public readonly id?: string,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.tenantId) throw new Error('MessageVO: tenantId is required');
    if (!this.userId) throw new Error('MessageVO: userId is required');
    if (!this.content || this.content.trim().length === 0) {
      throw new Error('MessageVO: content cannot be empty');
    }
  }

  /**
   * Helper for creating a new VO from an existing one (useful for mapping)
   */
  static create(params: MessageVO): MessageVO {
    return new MessageVO(
      params.tenantId,
      params.userId,
      params.content,
      params.channel,
      params.timestamp,
      params.id
    );
  }
}
