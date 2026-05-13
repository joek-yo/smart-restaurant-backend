// src/modules/conversation/application/policies/abuse-protection.policy.ts

import { Injectable } from '@nestjs/common';

/**
 * AbuseProtectionPolicy
 * ---------------------
 * Protects conversation engine from:
 * - spam messages
 * - retry floods
 * - duplicate bursts
 * - abusive automation
 *
 * NOTE:
 * This is NOT business logic.
 * It is a SYSTEM SAFETY GATE.
 */

interface MessageRecord {
  timestamp: number;
}

@Injectable()
export class AbuseProtectionPolicy {
  /**
   * In-memory rate tracking (can later move to Redis)
   * Key: tenantId:userId
   */
  private messageHistory: Map<string, MessageRecord[]> = new Map();

  /**
   * CONFIGURATION
   */
  private readonly MAX_MESSAGES_PER_WINDOW = 10;
  private readonly WINDOW_MS = 10_000; // 10 seconds

  private readonly DUPLICATE_WINDOW_MS = 5_000;

  /**
   * ENTRY CHECK
   */
  validate(input: {
    tenantId: string;
    userId: string;
    messageId: string;
  }): void {
    const key = `${input.tenantId}:${input.userId}`;
    const now = Date.now();

    const history = this.messageHistory.get(key) || [];

    // ==================================================
    // 1. CLEAN OLD RECORDS (sliding window)
    // ==================================================
    const recent = history.filter(
      (m) => now - m.timestamp < this.WINDOW_MS,
    );

    // ==================================================
    // 2. RATE LIMIT CHECK (flood protection)
    // ==================================================
    if (recent.length >= this.MAX_MESSAGES_PER_WINDOW) {
      throw new Error(
        `[ABUSE BLOCKED] Too many messages from ${key}`,
      );
    }

    // ==================================================
    // 3. DUPLICATE BURST PROTECTION
    // ==================================================
    const duplicate = recent.find(
      (m) => now - m.timestamp < this.DUPLICATE_WINDOW_MS,
    );

    if (duplicate) {
      throw new Error(
        `[ABUSE BLOCKED] Duplicate burst detected for ${key}`,
      );
    }

    // ==================================================
    // 4. UPDATE HISTORY
    // ==================================================
    recent.push({ timestamp: now });

    this.messageHistory.set(key, recent);
  }

  /**
   * OPTIONAL: reset user (useful for recovery engine)
   */
  reset(tenantId: string, userId: string): void {
    const key = `${tenantId}:${userId}`;
    this.messageHistory.delete(key);
  }
}