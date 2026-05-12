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
    // 1. Idempotency — return existing order if already created
    // ─────────────────────────────────────────────
    if (session.id) {
      const existing = await this.orderRepo.findBySessionId(session.id);
      if (existing) {
        this.logger.warn(
          `[IDEMPOTENT] Order already exists for sessionId=${session.id}, orderId=${existing.id}`,
        );
        return existing;
      }
    }

    // ─────────────────────────────────────────────
    // 2. Map session → typed order draft
    // ─────────────────────────────────────────────
    const draft = SessionToOrderMapper.toOrderDraft(session);

    // ─────────────────────────────────────────────
    // 3. Recompute total from session items (never trust stored value)
    // ─────────────────────────────────────────────
    const recomputedTotal = session.items.reduce(
      (sum, item) => sum + item.total,
      0,
    );

    if (Math.abs(recomputedTotal - draft.total.value) > 0.01) {
      this.logger.warn(
        `[TOTAL MISMATCH] draft=${draft.total.value} recomputed=${recomputedTotal} — using recomputed`,
      );
    }

    // ─────────────────────────────────────────────
    // 4. Build Order domain object
    // ─────────────────────────────────────────────
    const orderInput = new Order({
      tenantId: draft.tenantId,
      customerId: draft.userId,
      customerName: 'Guest',
      items: draft.items,
      totalAmount: recomputedTotal,
      status: OrderStatus.PENDING,
      source: draft.metadata.source,
    });

    // Attach sessionId for idempotency on future retries
    (orderInput as any).sessionId = session.id;

    // ─────────────────────────────────────────────
    // 5. Persist
    // ─────────────────────────────────────────────
    const order = await this.orderRepo.create(orderInput);

    if (!order.id) {
      this.logger.error('Order created but ID missing', order);
      throw new Error('Order persistence failed: missing orderId');
    }

    // ─────────────────────────────────────────────
    // 6. Emit domain event
    // ─────────────────────────────────────────────
    this.eventBus.emit(EVENTS.ORDER_CREATED, {
      orderId: order.id,
      businessId: draft.tenantId,
      totalAmount: recomputedTotal,
      customerId: draft.userId,
      source: 'checkout',
      timestamp: new Date().toISOString(),
    });

    this.logger.log(
      `[ORDER_CREATED] orderId=${order.id} tenant=${draft.tenantId} total=${recomputedTotal}`,
    );

    return order;
  }
}
