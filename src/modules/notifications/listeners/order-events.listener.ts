// src/modules/notifications/listeners/order-events.listener.ts

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ORDER_EVENTS, BUSINESS_EVENTS } from '@core/events/event.constants';

@Injectable()
export class OrderEventsListener {
  // ✅ NestJS Logger for better EliteDesk terminal output
  private readonly logger = new Logger(OrderEventsListener.name);

  /**
   * Reacts to new orders.
   * Logic: Customer confirmation & Restaurant alerts.
   */
  @OnEvent(ORDER_EVENTS.ORDER_CREATED)
  handleOrderCreated(payload: { 
    orderId: string; 
    businessId: string; 
    totalAmount: number; 
    customerName?: string 
  }) {
    const { orderId, businessId, totalAmount, customerName } = payload;
    
    this.logger.log(`🟢 [EVENT] order.created | ID: ${orderId} | Business: ${businessId}`);
    this.logger.debug(`💰 Total: ${totalAmount} | Customer: ${customerName || 'Guest'}`);

    // 🔥 Future Integrations:
    // this.whatsappService.sendOrderAlert(businessId, orderId);
  }

  /**
   * Reacts when an order is finalized.
   * Logic: Loyalty points or Feedback requests.
   */
  @OnEvent(ORDER_EVENTS.ORDER_COMPLETED)
  handleOrderCompleted(payload: { orderId: string; businessId: string }) {
    this.logger.log(`✅ [EVENT] order.completed | ID: ${payload.orderId}`);
  }

  /**
   * Reacts to cancellations.
   * Logic: Kitchen stoppage & Refund alerts.
   */
  @OnEvent(ORDER_EVENTS.ORDER_CANCELLED)
  handleOrderCancelled(payload: { orderId: string; reason?: string }) {
    this.logger.warn(`❌ [EVENT] order.cancelled | ID: ${payload.orderId} | Reason: ${payload.reason || 'Not specified'}`);
  }
}