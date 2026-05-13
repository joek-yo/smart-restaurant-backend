// src/modules/conversation/domain/entities/conversation-context.entity.ts

import { ConversationState } from '../enums/conversation-state.enum';
import { ConversationChannel } from '../enums/conversation-channel.enum';

/**
 * ConversationContextEntity
 * --------------------------
 * PURE conversation memory ONLY.
 *
 * ❌ MUST NEVER contain:
 * - cart
 * - orders
 * - payment state
 * - business logic state
 *
 * ✅ ONLY contains:
 * - conversation state
 * - dialogue memory
 * - recovery metadata
 * - prompt flow state
 */

export interface PendingPrompt {
  type: string;
  payload?: Record<string, any>;
}

export interface RecoveryMarker {
  fromState: ConversationState;
  reason: string;
  timestamp: Date;
  retryCount?: number;
}

export class ConversationContextEntity {
  public id: string;
  public tenantId: string;
  public userId: string;
  public channel: ConversationChannel;

  public state: ConversationState;

  /**
   * MEMORY = conversational context ONLY
   * Examples:
   * - last intent
   * - user preferences
   * - language
   * - last message snippet
   */
  public memory: Record<string, any>;

  /**
   * Pending system prompt (for multi-step flows)
   */
  public pendingPrompt?: PendingPrompt;

  /**
   * Recovery tracking for:
   * - retries
   * - WhatsApp reconnect
   * - abandoned sessions
   */
  public recoveryMarker?: RecoveryMarker;

  public expiresAt: Date;
  public updatedAt: Date;

  constructor(
    idOrParams:
      | string
      | {
          id: string;
          tenantId: string;
          userId: string;
          channel: ConversationChannel;
          state?: ConversationState;
          memory?: Record<string, any>;
          pendingPrompt?: PendingPrompt;
          recoveryMarker?: RecoveryMarker;
          expiresAt?: Date;
          updatedAt?: Date;
        },
    tenantId?: string,
    userId?: string,
    channel?: ConversationChannel,
    state?: ConversationState,
    memory?: Record<string, any>,
    expiresAt?: Date,
    updatedAt?: Date,
  ) {
    if (typeof idOrParams === 'object') {
      this.id = idOrParams.id;
      this.tenantId = idOrParams.tenantId;
      this.userId = idOrParams.userId;
      this.channel = idOrParams.channel;
      this.state = idOrParams.state ?? ConversationState.IDLE;

      this.memory = idOrParams.memory ?? {};
      this.pendingPrompt = idOrParams.pendingPrompt;
      this.recoveryMarker = idOrParams.recoveryMarker;

      this.expiresAt =
        idOrParams.expiresAt ??
        new Date(Date.now() + 1000 * 60 * 60 * 3); // 3h default TTL

      this.updatedAt = idOrParams.updatedAt ?? new Date();
    } else {
      this.id = idOrParams;
      this.tenantId = tenantId!;
      this.userId = userId!;
      this.channel = channel!;
      this.state = state ?? ConversationState.IDLE;

      this.memory = memory ?? {};

      this.expiresAt =
        expiresAt ?? new Date(Date.now() + 1000 * 60 * 60 * 3);

      this.updatedAt = updatedAt ?? new Date();
    }
  }

  // ==================================================
  // STATE MANAGEMENT
  // ==================================================

  updateState(newState: ConversationState): void {
    this.state = newState;
    this.touch();
  }

  // ==================================================
  // MEMORY (CONVERSATION ONLY)
  // ==================================================

  setMemory(key: string, value: any): void {
    this.memory[key] = value;
    this.touch();
  }

  getMemory<T = any>(key: string): T | undefined {
    return this.memory[key] as T;
  }

  clearMemory(): void {
    this.memory = {};
    this.touch();
  }

  // ==================================================
  // PROMPT FLOW CONTROL
  // ==================================================

  setPendingPrompt(prompt: PendingPrompt): void {
    this.pendingPrompt = prompt;
    this.touch();
  }

  clearPendingPrompt(): void {
    this.pendingPrompt = undefined;
    this.touch();
  }

  // ==================================================
  // RECOVERY SYSTEM
  // ==================================================

  markRecovery(fromState: ConversationState, reason: string): void {
    const retryCount = (this.recoveryMarker?.retryCount ?? 0) + 1;

    this.recoveryMarker = {
      fromState,
      reason,
      timestamp: new Date(),
      retryCount,
    };

    this.touch();
  }

  clearRecovery(): void {
    this.recoveryMarker = undefined;
    this.touch();
  }

  isInRecovery(): boolean {
    return this.recoveryMarker !== undefined;
  }

  // ==================================================
  // LIFECYCLE
  // ==================================================

  isExpired(): boolean {
    return Date.now() > this.expiresAt.getTime();
  }

  extendTtl(minutes = 60): void {
    this.expiresAt = new Date(Date.now() + minutes * 60 * 1000);
    this.touch();
  }

  // ==================================================
  // INTERNAL
  // ==================================================

  touch(): void {
    this.updatedAt = new Date();
  }
}