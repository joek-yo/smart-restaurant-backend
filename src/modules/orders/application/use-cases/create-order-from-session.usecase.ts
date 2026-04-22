// 📁 File: src/modules/orders/application/use-cases/create-order-from-session.usecase.ts

import { Injectable, Inject } from '@nestjs/common';

import { ORDER_REPOSITORY } from '@modules/orders/domain/repositories/order.tokens';
import { OrderRepository } from '@modules/orders/domain/repositories/order.repository';
import { Order } from '@modules/orders/domain/entities/order.entity';

// 🔥 NEW: Import Event System
import { EventBus } from '@core/events';
import { EVENTS } from '@core/events/event.constants';

@Injectable()
export class CreateOrderFromSessionUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepo: OrderRepository,
    
    // ✅ Inject the Global EventBus
    private readonly eventBus: EventBus,
  ) {}

  async execute(session: any): Promise<Order> {
    // 1. Build domain entity
    const order = Order.fromSession(session);

    // 2. Assign queue number (simple fallback logic)
    // Note: On your EliteDesk, Date.now() is fine for dev, 
    // but consider a daily reset counter later!
    order.queueNumber = Date.now();

    // 3. Persist via repository abstraction
    const savedOrder = await this.orderRepo.create(order);

    // 4. 🔥 EMIT order.created
    // We use the savedOrder to ensure we have the generated DB ID
    const orderId = (savedOrder as any)?._id?.toString() || (savedOrder as any)?.id;

    this.eventBus.emit(EVENTS.ORDER_CREATED, {
      orderId,
      businessId: savedOrder.businessId,
      totalAmount: savedOrder.totalAmount,
      customerName: session.customerName || 'Guest',
    });

    return savedOrder;
  }
}