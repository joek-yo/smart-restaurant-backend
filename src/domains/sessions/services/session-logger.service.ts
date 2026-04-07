//📁 src/domains/sessions/services/session-logger.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { Session } from '../entities/session.entity';

@Injectable()
export class SessionLoggerService {
  private readonly logger = new Logger(SessionLoggerService.name);

  /**
   * Logs session creation
   */
  async logSessionCreated(session: Session): Promise<void> {
    this.logger.log(
      `[SESSION CREATED] sessionId=${session.id} customer=${session.customerId} business=${session.businessId}`,
    );
  }

  /**
   * Logs cart update actions (add/remove/update)
   */
  async logCartUpdate(
    sessionId: string,
    action: 'ADD' | 'REMOVE' | 'UPDATE',
    metadata?: Record<string, any>,
  ): Promise<void> {
    this.logger.log(
      `[CART ${action}] sessionId=${sessionId} data=${JSON.stringify(metadata || {})}`,
    );
  }

  /**
   * Logs checkout
   */
  async logCheckout(session: Session): Promise<void> {
    this.logger.log(
      `[CHECKOUT] sessionId=${session.id} total=${session.totalAmount} items=${session.items.length}`,
    );
  }

  /**
   * Logs session expiration
   */
  async logSessionExpired(sessionId: string): Promise<void> {
    this.logger.warn(`[SESSION EXPIRED] sessionId=${sessionId}`);
  }

  /**
   * Logs abandoned cart trigger
   */
  async logAbandonedCart(sessionId: string): Promise<void> {
    this.logger.warn(`[ABANDONED CART] sessionId=${sessionId}`);
  }

  /**
   * Logs errors for observability
   */
  async logError(
    context: string,
    error: unknown,
    metadata?: Record<string, any>,
  ): Promise<void> {
    this.logger.error(
      `[ERROR] context=${context} error=${(error as any)?.message || error}`,
      JSON.stringify(metadata || {}),
    );
  }
}