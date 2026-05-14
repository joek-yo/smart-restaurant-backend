// src/modules/smartpage/infrastructure/adapters/sessions.adapter.ts

import { Injectable, Logger } from '@nestjs/common';

/**
 * SessionsAdapter
 * ------------------------------------------------------
 * Bridge between SmartPage Engine and Session Engine.
 *
 * Purpose:
 * - Fetch session state for rendering context
 * - Detect cart/session activity
 * - Provide real-time session signals to SmartPage
 *
 * IMPORTANT:
 * This adapter MUST remain thin.
 * No business logic here.
 * Only data translation + access layer.
 */

export interface SessionSnapshot {
  sessionId: string;
  userId: string;
  tenantId: string;

  isActive: boolean;
  lastActivityAt: Date;

  hasCart: boolean;
  cartItemCount: number;

  metadata?: Record<string, any>;
}

@Injectable()
export class SessionsAdapter {
  private readonly logger = new Logger(SessionsAdapter.name);

  // ======================================================
  // 🔍 GET SESSION SNAPSHOT
  // ======================================================
  async getSessionSnapshot(input: {
    tenantId: string;
    userId: string;
    sessionId?: string;
  }): Promise<SessionSnapshot | null> {
    try {
      // NOTE:
      // In real implementation this will call:
      // - Session service
      // - Redis session store
      // - or Session domain module

      // Placeholder safe mock structure (replace later)
      const snapshot: SessionSnapshot = {
        sessionId: input.sessionId ?? 'unknown',
        userId: input.userId,
        tenantId: input.tenantId,

        isActive: true,
        lastActivityAt: new Date(),

        hasCart: false,
        cartItemCount: 0,

        metadata: {},
      };

      this.logger.debug(
        `[SessionsAdapter] snapshot fetched for user=${input.userId}`,
      );

      return snapshot;
    } catch (error) {
      this.logger.error(
        `[SessionsAdapter] failed to fetch session snapshot`,
        error instanceof Error ? error.stack : String(error),
      );

      return null;
    }
  }

  // ======================================================
  // 🛒 CHECK CART STATE
  // ======================================================
  async hasActiveCart(input: {
    tenantId: string;
    userId: string;
  }): Promise<boolean> {
    const session = await this.getSessionSnapshot(input);

    return session?.hasCart ?? false;
  }

  // ======================================================
  // 📦 GET CART ITEM COUNT
  // ======================================================
  async getCartItemCount(input: {
    tenantId: string;
    userId: string;
  }): Promise<number> {
    const session = await this.getSessionSnapshot(input);

    return session?.cartItemCount ?? 0;
  }

  // ======================================================
  // ⚡ SESSION ACTIVITY CHECK
  // ======================================================
  async isSessionActive(input: {
    tenantId: string;
    userId: string;
  }): Promise<boolean> {
    const session = await this.getSessionSnapshot(input);

    return session?.isActive ?? false;
  }
}