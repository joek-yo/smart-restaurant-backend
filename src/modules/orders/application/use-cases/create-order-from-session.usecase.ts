// src/modules/orders/application/use-cases/create-order-from-session.usecase.ts

import { Injectable, Inject } from '@nestjs/common';

import { ORDER_REPOSITORY } from '@modules/orders/domain/repositories/order.tokens';
import { OrderRepository } from '@modules/orders/domain/repositories/order.repository';
import { Order } from '@modules/orders/domain/entities/order.entity';

import { EventBus } from '@core/events';
import { EVENTS } from '@core/events/event.constants';

/**
 * CreateOrderFromSessionUseCase
 * ------------------------------
 * FINAL step in order pipeline.
 *
 * RULES:
 * - This is the SINGLE source of ORDER_CREATED event
 * - Checkout MUST NOT emit order.created anymore
 * - Order module owns persistence + event publishing
 */

@Injectable()
export class CreateOrderFromSessionUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepo: OrderRepository,

    private readonly eventBus: EventBus,
  ) {}

  async execute(session: any): Promise<Order> {
    // ─────────────────────────────────────────────
    // 1. Build domain entity from session
    // ─────────────────────────────────────────────
    const order = Order.fromSession(session);

    // ─────────────────────────────────────────────
    // 2. Assign queue number (simple dev strategy)
    // ─────────────────────────────────────────────
    order.queueNumber = Date.now();

    // ─────────────────────────────────────────────
    // 3. Persist order
    // ─────────────────────────────────────────────
    const savedOrder = await this.orderRepo.create(order);

    const orderId =
      (savedOrder as any)?._id?.toString() ??
      (savedOrder as any)?.id;

    // ─────────────────────────────────────────────
    // 4. DOMAIN EVENT (SINGLE SOURCE OF TRUTH)
    // ─────────────────────────────────────────────
    this.eventBus.emit(EVENTS.ORDER_CREATED, {
      orderId,
      businessId: savedOrder.businessId,
      totalAmount: savedOrder.totalAmount,
      customerName: session.customerName || 'Guest',
      source: 'order-service', // 🔥 helps debugging event origin
    });

    return savedOrder;
  }
}