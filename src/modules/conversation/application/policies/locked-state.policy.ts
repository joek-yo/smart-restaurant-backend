// src/modules/conversation/application/policies/locked-state.policy.ts

import { Injectable } from '@nestjs/common';
import { ConversationState } from '../../domain/enums/conversation-state.enum';

/**
 * LockedStatePolicy
 * ------------------
 * HARD RULE ENFORCER for conversation safety.
 *
 * Purpose:
 * - Prevent illegal actions during critical states
 * - Protect payment / order finalization flows
 *
 * This is NOT business logic.
 * This is a safety gate.
 */
@Injectable()
export class LockedStatePolicy {

  /**
   * States where user actions must be restricted
   */
  private readonly lockedStates = new Set<ConversationState>([
    ConversationState.CHECKOUT,
    ConversationState.CART_UPDATED,
    ConversationState.COMPLETED,
    ConversationState.ABANDONED,
  ]);

  /**
   * Checks if state is locked
   */
  isLocked(state: ConversationState): boolean {
    return this.lockedStates.has(state);
  }

  /**
   * Determines whether a specific intent is allowed in locked state
   */
  allowIntent(state: ConversationState, intent: string): boolean {

    if (!this.isLocked(state)) {
      return true;
    }

    // =========================
    // SAFE INTENTS DURING LOCK
    // =========================
    const allowedDuringLock = new Set([
      'ASK_HELP',
      'VIEW_CART',
      'CANCEL_ORDER',
    ]);

    return allowedDuringLock.has(intent);
  }

  /**
   * Determines if system should block execution entirely
   */
  shouldBlock(state: ConversationState, intent: string): boolean {
    return this.isLocked(state) && !this.allowIntent(state, intent);
  }

  /**
   * Returns reason for blocking (useful for debugging / logs)
   */
  getBlockReason(state: ConversationState, intent: string): string | null {
    if (!this.shouldBlock(state, intent)) return null;

    return `Intent "${intent}" blocked in locked state "${state}"`;
  }
}