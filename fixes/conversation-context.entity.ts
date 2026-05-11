// src/modules/conversation/domain/entities/conversation-context.entity.ts
//
// ✅ FIX 1 — Cart REMOVED. Conversation owns: state, memory, orchestration only.
// Session engine is the single source of truth for cart/items/totals.

import { ConversationState } from '../enums/conversation-state.enum';
import { ConversationChannel } from '../enums/conversation-channel.enum';

export interface PendingPrompt {
  type: string;
  payload?: Record<string, any>;
}

export interface RecoveryMarker {
  fromState: ConversationState;
  reason: string;
  timestamp: Date;
}

export class ConversationContextEntity {
  public id: string;
  public tenantId: string;
  public userId: string;
  public channel: ConversationChannel;
  public state: ConversationState;
  public memory: Record<string, any>;
  public pendingPrompt?: PendingPrompt;
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
      this.expiresAt = idOrParams.expiresAt ?? new Date(Date.now() + 1000 * 60 * 60 * 3);
      this.updatedAt = idOrParams.updatedAt ?? new Date();
    } else {
      this.id = idOrParams;
      this.tenantId = tenantId!;
      this.userId = userId!;
      this.channel = channel!;
      this.state = state ?? ConversationState.IDLE;
      this.memory = memory ?? {};
      this.expiresAt = expiresAt ?? new Date(Date.now() + 1000 * 60 * 60 * 3);
      this.updatedAt = updatedAt ?? new Date();
    }
  }

  // ─── State ────────────────────────────────────────────────────────────────

  updateState(newState: ConversationState): void {
    this.state = newState;
    this.touch();
  }

  // ─── Memory (dialogue context only — NOT cart data) ───────────────────────

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

  // ─── Pending Prompt ───────────────────────────────────────────────────────

  setPendingPrompt(prompt: PendingPrompt): void {
    this.pendingPrompt = prompt;
    this.touch();
  }

  clearPendingPrompt(): void {
    this.pendingPrompt = undefined;
    this.touch();
  }

  // ─── Recovery ─────────────────────────────────────────────────────────────

  markRecovery(fromState: ConversationState, reason: string): void {
    this.recoveryMarker = { fromState, reason, timestamp: new Date() };
    this.touch();
  }

  clearRecovery(): void {
    this.recoveryMarker = undefined;
    this.touch();
  }

  // ─── Internal ─────────────────────────────────────────────────────────────

  private touch(): void {
    this.updatedAt = new Date();
  }
}