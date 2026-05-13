import { ConversationState } from '../enums/conversation-state.enum';
import { ConversationChannel } from '../enums/conversation-channel.enum';
import { ConversationIntent } from '../enums/conversation-intent.enum';
import { TenantVO } from '../value-objects/tenant.vo';
import { UserVO } from '../value-objects/user.vo';

/**
 * ConversationEntity
 * -------------------
 * Root aggregate for all conversation interactions.
 * Orchestrates the relationship between the user, the channel, and the current state.
 */
export class ConversationEntity {
  constructor(
    public readonly id: string,
    public readonly tenant: TenantVO,
    public readonly user: UserVO,
    public readonly channel: ConversationChannel,
    public state: ConversationState = ConversationState.IDLE,
    public lastIntent: ConversationIntent = ConversationIntent.UNKNOWN,
    public contextId?: string,
    public readonly createdAt: Date = new Date(),
    public lastMessageAt: Date = new Date()
  ) {}

  /**
   * Safe state transition
   */
  updateState(newState: ConversationState): void {
    this.state = newState;
    this.touch();
  }

  /**
   * Update the last detected intent
   */
  updateIntent(intent: ConversationIntent): void {
    this.lastIntent = intent;
    this.touch();
  }

  /**
   * Links a Redis-stored context snapshot to this entity
   */
  attachContext(contextId: string): void {
    this.contextId = contextId;
    this.touch();
  }

  /**
   * Updates the activity timestamp
   */
  touch(): void {
    this.lastMessageAt = new Date();
  }

  /**
   * Helper to check if conversation is in a terminal state
   */
  isTerminal(): boolean {
    return [
      ConversationState.COMPLETED,
      ConversationState.CANCELLED,
      ConversationState.ERROR
    ].includes(this.state);
  }
}
