// src/modules/conversation/infrastructure/adapters/sessions.adapter.ts

import { Injectable } from '@nestjs/common';

/**
 * SESSIONS ADAPTER (ANTI-COUPLING LAYER)
 * --------------------------------------
 * Conversation Engine MUST NOT depend on SessionService directly.
 *
 * This adapter:
 * - abstracts session/cart operations
 * - allows future replacement (Redis / Event-sourced / Microservice)
 * - isolates legacy coupling
 */

@Injectable()
export class SessionsAdapter {

  // NOTE: SessionService will be injected later via constructor
  // DO NOT import SessionService directly into conversation domain

  constructor(
    // private readonly sessionService: SessionService, ❌ intentionally NOT used yet
  ) {}

  /**
   * Get cart state for user
   */
  async getCart(userId: string): Promise<any[]> {
    // TODO: wire to SessionService or Redis later
    return [];
  }

  /**
   * Add item to cart
   */
  async addItem(userId: string, item: any): Promise<void> {
    // TODO: replace with sessionService.addItem
  }

  /**
   * Remove item
   */
  async removeItem(userId: string, productId: string): Promise<void> {
    // TODO
  }

  /**
   * Clear cart
   */
  async clear(userId: string): Promise<void> {
    // TODO
  }

  /**
   * Get session summary (optional helper)
   */
  async getSession(userId: string): Promise<any> {
    return {
      userId,
      items: [],
      total: 0,
    };
  }
}
