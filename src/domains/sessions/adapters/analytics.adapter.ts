// 📁 src/domains/sessions/adapters/analytics.adapter.ts

import { Injectable, Logger } from '@nestjs/common';
import { SessionEntity } from '../entities/session.entity';

export interface AnalyticsEvent {
  event: string;
  userId: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

@Injectable()
export class AnalyticsAdapter {
  private readonly logger = new Logger(AnalyticsAdapter.name);

  /**
   * Track generic event
   */
  async track(event: AnalyticsEvent): Promise<void> {
    try {
      // 🔗 TODO: integrate with analytics provider (Segment, Mixpanel, GA, etc.)
      this.logger.log(`Analytics Event: ${event.event}`);
      this.logger.debug(event);
    } catch (error) {
      this.logger.error('Analytics tracking failed', error);
    }
  }

  /**
   * Track when item is added to cart
   */
  async trackAddToCart(session: SessionEntity): Promise<void> {
    await this.track({
      event: 'cart_item_added',
      userId: session.userId,
      sessionId: session.id,
      metadata: {
        itemCount: session.items.length,
        totalAmount: session.totalAmount,
      },
      timestamp: new Date(),
    });
  }

  /**
   * Track checkout event
   */
  async trackCheckout(session: SessionEntity): Promise<void> {
    await this.track({
      event: 'session_checkout',
      userId: session.userId,
      sessionId: session.id,
      metadata: {
        totalAmount: session.totalAmount,
        itemCount: session.items.length,
      },
      timestamp: new Date(),
    });
  }

  /**
   * Track abandoned cart
   */
  async trackAbandonedCart(session: SessionEntity): Promise<void> {
    await this.track({
      event: 'abandoned_cart',
      userId: session.userId,
      sessionId: session.id,
      metadata: {
        itemCount: session.items.length,
        totalAmount: session.totalAmount,
      },
      timestamp: new Date(),
    });
  }
}