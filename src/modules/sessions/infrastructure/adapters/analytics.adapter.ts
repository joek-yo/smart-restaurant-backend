// 📁 src/modules/sessions/domain/adapters/analytics.adapter.ts

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

  async track(event: AnalyticsEvent): Promise<void> {
    try {
      this.logger.log(`Analytics Event: ${event.event}`);
      this.logger.debug(event);
    } catch (error) {
      this.logger.error('Analytics tracking failed', error);
    }
  }

  // FIXED: align with handler expectations
  async trackCartItemAdded(session: SessionEntity): Promise<void> {
    return this.track({
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

  async trackCartItemRemoved(session: SessionEntity): Promise<void> {
    return this.track({
      event: 'cart_item_removed',
      userId: session.userId,
      sessionId: session.id,
      metadata: {
        itemCount: session.items.length,
        totalAmount: session.totalAmount,
      },
      timestamp: new Date(),
    });
  }

  async trackQuantityUpdated(session: SessionEntity): Promise<void> {
    return this.track({
      event: 'cart_quantity_updated',
      userId: session.userId,
      sessionId: session.id,
      metadata: {
        itemCount: session.items.length,
        totalAmount: session.totalAmount,
      },
      timestamp: new Date(),
    });
  }

  async trackSessionCheckedOut(session: SessionEntity): Promise<void> {
    return this.track({
      event: 'session_checked_out',
      userId: session.userId,
      sessionId: session.id,
      metadata: {
        totalAmount: session.totalAmount,
        itemCount: session.items.length,
      },
      timestamp: new Date(),
    });
  }

  async trackAbandonedCart(session: SessionEntity): Promise<void> {
    return this.track({
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