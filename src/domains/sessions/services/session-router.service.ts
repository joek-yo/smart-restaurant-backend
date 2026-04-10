// 📁 src/domains/sessions/services/session-router.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { SessionEntity } from '../entities/session.entity';

/**
 * Router service responsible for dispatching session-related
 * events to external communication channels (WhatsApp, SMS, etc.)
 */
@Injectable()
export class SessionRouterService {
  private readonly logger = new Logger(SessionRouterService.name);

  /**
   * Triggered when item is added to cart
   */
  async onCartItemAdded(session: SessionEntity): Promise<void> {
    this.logger.log(
      `[ROUTER] Cart item added → sessionId=${session.id}`,
    );
  }

  /**
   * Triggered when item is removed
   */
  async onCartItemRemoved(session: SessionEntity): Promise<void> {
    this.logger.log(
      `[ROUTER] Cart item removed → sessionId=${session.id}`,
    );
  }

  /**
   * Triggered when quantity is updated
   */
  async onQuantityUpdated(session: SessionEntity): Promise<void> {
    this.logger.log(
      `[ROUTER] Quantity updated → sessionId=${session.id}`,
    );
  }

  /**
   * Triggered on checkout
   */
  async onCheckout(session: SessionEntity): Promise<void> {
    this.logger.log(
      `[ROUTER] Checkout triggered → sessionId=${session.id}`,
    );
  }

  /**
   * Triggered when session expires
   */
  async onSessionExpired(session: SessionEntity): Promise<void> {
    this.logger.warn(
      `[ROUTER] Session expired → sessionId=${session.id}`,
    );
  }

  /**
   * Trigger abandoned cart flow
   */
  async onAbandonedCart(session: SessionEntity): Promise<void> {
    this.logger.warn(
      `[ROUTER] Abandoned cart → sessionId=${session.id}`,
    );
  }
}