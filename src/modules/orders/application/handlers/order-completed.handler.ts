// src/modules/orders/application/handlers/order-completed.handler.ts

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ORDER_EVENTS } from '@core/events/event.constants';

/**
 * OrderCompletedHandler
 * ---------------------
 * Reactive side-effect handler for completed orders.
 *
 * IMPORTANT:
 * - NO business logic mutation
 * - NO order state changes
 * - ONLY post-completion side effects
 */

@Injectable()
export class OrderCompletedHandler {
  private readonly logger = new Logger(OrderCompletedHandler.name);

  @OnEvent(ORDER_EVENTS.ORDER_COMPLETED, { async: true })
  async handle(payload: {
    orderId: string;
    businessId: string;
    customerId?: string;
    totalAmount?: number;
    source?: string;
    timestamp?: string;
  }) {
    this.logger.log(
      `[ORDER_COMPLETED] orderId=${payload.orderId} businessId=${payload.businessId}`,
    );

    // ─────────────────────────────────────────────
    // 1. Notification hook (future extension point)
    // ─────────────────────────────────────────────
    await this.sendCompletionNotification(payload);

    // ─────────────────────────────────────────────
    // 2. Analytics / tracking hook
    // ─────────────────────────────────────────────
    await this.trackOrderMetrics(payload);

    // ─────────────────────────────────────────────
    // 3. Inventory sync trigger (optional future system)
    // ─────────────────────────────────────────────
    await this.syncInventoryReduction(payload);
  }

  // ─────────────────────────────────────────────
  // SIDE EFFECT: NOTIFICATIONS
  // ─────────────────────────────────────────────
  private async sendCompletionNotification(payload: any) {
    // Placeholder: WhatsApp / Email / Push
    this.logger.debug(
      `[NOTIFY] Order completed → ${payload.orderId}`,
    );
  }

  // ─────────────────────────────────────────────
  // SIDE EFFECT: ANALYTICS
  // ─────────────────────────────────────────────
  private async trackOrderMetrics(payload: any) {
    this.logger.debug(
      `[ANALYTICS] Tracking order → ${payload.orderId}`,
    );
  }

  // ─────────────────────────────────────────────
  // SIDE EFFECT: INVENTORY SYNC
  // ─────────────────────────────────────────────
  private async syncInventoryReduction(payload: any) {
    this.logger.debug(
      `[INVENTORY] Sync trigger → ${payload.orderId}`,
    );
  }
}