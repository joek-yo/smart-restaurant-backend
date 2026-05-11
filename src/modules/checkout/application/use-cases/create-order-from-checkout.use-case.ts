// src/modules/checkout/application/use-cases/create-order-from-checkout.use-case.ts

import { Injectable, Inject, Logger } from '@nestjs/common';

import { SessionEntity } from '@modules/sessions/domain/entities/session.entity';
import { Order } from '@modules/orders/domain/entities/order.entity';
import { OrderStatus } from '@modules/orders/domain/entities/order-status.enum';
import { OrderRepository } from '@modules/orders/domain/repositories/order.repository';
import { ORDER_REPOSITORY } from '@modules/orders/domain/repositories/order.tokens';

import { SessionToOrderMapper } from '../mappers/session-to-order.mapper';
import { EventBus } from '@core/events/event.bus';
import { EVENTS } from '@core/events/event.constants';

/**
 * CreateOrderFromCheckoutUseCase
 * --------------------------------
 * SINGLE RESPONSIBILITY:
 * Converts a checked-out SessionEntity → persisted Order
 * Emits ORDER_CREATED after persistence success.
 *
 * This is the ONLY place in the system that creates orders from sessions.
 */
@Injectable()
export class CreateOrderFromCheckoutUseCase {
  private readonly logger = new Logger(CreateOrderFromCheckoutUseCase.name);

  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepo: OrderRepository,

    private readonly eventBus: EventBus,
  ) {}

  async execute(session: SessionEntity): Promise<Order> {
    if (!session) {
      throw new Error('CreateOrderFromCheckoutUseCase: session is required');
    }

    // ─────────────────────────────────────────────
    // 1. Map session → typed order draft
    // ─────────────────────────────────────────────
    const draft = SessionToOrderMapper.toOrderDraft(session);

    // ─────────────────────────────────────────────
    // 2. Build a proper Order domain object
    // ─────────────────────────────────────────────
    const orderInput = new Order({
      tenantId: draft.tenantId,
      customerId: draft.userId,
      customerName: 'Guest',
      items: draft.items,
      totalAmount: draft.total.value,
      status: OrderStatus.PENDING,
      source: draft.metadata.source,
    });

    // ─────────────────────────────────────────────
    // 3. Persist (source of truth)
    // ─────────────────────────────────────────────
    const order = await this.orderRepo.create(orderInput);

    if (!order.id) {
      this.logger.error('Order created but ID missing', order);
      throw new Error('Order persistence failed: missing orderId');
    }

    // ─────────────────────────────────────────────
    // 4. Emit domain event
    // ─────────────────────────────────────────────
    this.eventBus.emit(EVENTS.ORDER_CREATED, {
      orderId: order.id,
      businessId: draft.tenantId,
      totalAmount: draft.total.value,
      customerId: draft.userId,
      source: 'checkout',
      timestamp: new Date().toISOString(),
    });

    this.logger.log(
      `[ORDER_CREATED] orderId=${order.id} tenant=${draft.tenantId}`,
    );

    return order;
  }
}