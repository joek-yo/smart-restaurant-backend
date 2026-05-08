// src/modules/checkout/application/use-cases/create-order-from-checkout.use-case.ts

import { Injectable } from '@nestjs/common';
import { SessionToOrderMapper } from '../mappers/session-to-order.mapper';
import { OrderRepository } from '@modules/orders/domain/repositories/order.repository';
import { Inject } from '@nestjs/common';
import { ORDER_REPOSITORY } from '@modules/orders/domain/repositories/order.tokens';
import { EventBus } from '@core/events';
import { EVENTS } from '@core/events/event.constants';

/**
 * CreateOrderFromCheckoutUseCase
 * ------------------------------
 * Converts checkout session → persisted order
 */

@Injectable()
export class CreateOrderFromCheckoutUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepo: OrderRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(session: any) {
    // 1. Transform session → order draft
    const draft = SessionToOrderMapper.toOrderDraft(session);

    // 2. Persist order
    const order = await this.orderRepo.create({
      tenantId: draft.tenantId,
      customerId: draft.userId,
      items: draft.items,
      totalAmount: draft.total.value,
      status: 'PENDING',
    } as any);

    // 3. Emit domain event
    this.eventBus.emit(EVENTS.ORDER_CREATED, {
      orderId: (order as any).id,
      tenantId: draft.tenantId,
      total: draft.total.value,
    });

    return order;
  }
}