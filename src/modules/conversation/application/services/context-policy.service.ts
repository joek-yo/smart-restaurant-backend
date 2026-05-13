// src/modules/conversation/application/services/context-policy.service.ts

import { Injectable } from '@nestjs/common';
import { ConversationContextEntity } from '../../domain/entities/conversation-context.entity';
import { ConversationState } from '../../domain/enums/conversation-state.enum';

/**
 * ContextPolicyService
 * --------------------
 * Governs lifecycle rules for conversation context:
 * - expiration rules
 * - staleness detection
 * - reset eligibility
 *
 * IMPORTANT:
 * This service does NOT mutate state permanently.
 * It only evaluates and enforces policy decisions.
 */
@Injectable()
export class ContextPolicyService {

  /**
   * Determines whether a context is stale
   */
  isStale(context: ConversationContextEntity): boolean {
    if (!context.updatedAt) return true;

    const now = Date.now();
    const updated = new Date(context.updatedAt).getTime();

    // 30 minutes inactivity threshold (configurable later)
    const STALE_THRESHOLD_MS = 30 * 60 * 1000;

    return now - updated > STALE_THRESHOLD_MS;
  }

  /**
   * Determines whether a context is expired and unusable
   */
  isExpired(context: ConversationContextEntity): boolean {
    if (!context.expiresAt) return false;

    return new Date(context.expiresAt).getTime() < Date.now();
  }

  /**
   * Determines whether context can safely continue flow
   */
  isActive(context: ConversationContextEntity): boolean {
    return !this.isStale(context) && !this.isExpired(context);
  }

  /**
   * Determines if context should be reset entirely
   */
  shouldReset(context: ConversationContextEntity): boolean {
    return (
      this.isExpired(context) ||
      context.state === ConversationState.ABANDONED
    );
  }

  /**
   * Determines if context should enter recovery mode
   */
  shouldRecover(context: ConversationContextEntity): boolean {
    return (
      this.isStale(context) &&
      !this.isExpired(context)
    );
  }

  /**
   * Returns a safe status label for orchestration layer
   */
  evaluate(context: ConversationContextEntity): {
    status: 'ACTIVE' | 'STALE' | 'EXPIRED' | 'RECOVERY_REQUIRED';
  } {

    if (this.isExpired(context)) {
      return { status: 'EXPIRED' };
    }

    if (this.isStale(context)) {
      return { status: 'STALE' };
    }

    return { status: 'ACTIVE' };
  }
}