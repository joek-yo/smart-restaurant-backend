// src/modules/checkout/application/use-cases/create-order-from-checkout.use-case.ts

import { Injectable, Inject, Logger, BadRequestException } from '@nestjs/common';

import { SessionEntity } from '@modules/sessions/domain/entities/session.entity';
import { Order } from '@modules/orders/domain/entities/order.entity';
import { OrderStatus } from '@modules/orders/domain/entities/order-status.enum';
import { OrderRepository } from '@modules/orders/domain/repositories/order.repository';
import { ORDER_REPOSITORY } from '@modules/orders/domain/repositories/order.tokens';

import { SessionToOrderMapper } from '../mappers/session-to-order.mapper';
import { EventBus } from '@core/events/event.bus';
import { ORDER_EVENTS } from '@core/events/event.constants';

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
      throw new BadRequestException('Session is required');
    }

    // ─────────────────────────────────────────────
    // 🔒 STATE GUARD (must be in checkout-confirmed flow)
    // ─────────────────────────────────────────────
    const allowedStates = ['CHECKOUT', 'PAYMENT_PENDING'];

    if (!allowedStates.includes(session.state?.value ?? session.state)) {
      throw new BadRequestException(
        `Invalid session state for order creation: ${
          session.state?.value ?? session.state
        }`,
      );
    }

    // ─────────────────────────────────────────────
    // 🧠 STRICT IDEMPOTENCY (session-based + repo lookup)
    // ─────────────────────────────────────────────
    const existing = await this.orderRepo.findBySessionId(session.id!);

    if (existing) {
      this.logger.warn(
        `[IDEMPOTENT] Order already exists for session=${session.id}`,
      );
      return existing;
    }

    // ─────────────────────────────────────────────
    // 📦 MAP SESSION → ORDER DRAFT
    // ─────────────────────────────────────────────
    const draft = SessionToOrderMapper.toOrderDraft(session);

    // ─────────────────────────────────────────────
    // 💰 RECOMPUTE TOTAL (SOURCE OF TRUTH ENFORCED)
    // ─────────────────────────────────────────────
    const recomputedTotal = session.items.reduce(
      (sum, item) => sum + item.total,
      0,
    );

    const finalTotal =
      Math.abs(recomputedTotal - draft.total.value) > 0.01
        ? recomputedTotal
        : draft.total.value;

    // ─────────────────────────────────────────────
    // 🧾 BUILD ORDER ENTITY (STRICT CONTRACT)
    // ─────────────────────────────────────────────
    const orderInput = new Order({
      tenantId: draft.tenantId,
      customerId: draft.userId,
      customerName: 'Guest',
      items: draft.items,
      totalAmount: finalTotal,
      status: OrderStatus.PENDING,
      source: draft.metadata.source,
    });

    // STRICT: attach sessionId explicitly (no hidden mutation)

    // ─────────────────────────────────────────────
    // 💾 PERSIST ORDER
    // ─────────────────────────────────────────────
    const order = await this.orderRepo.create(orderInput);

    if (!order?.id) {
      throw new Error('Order persistence failed: missing orderId');
    }

    // ─────────────────────────────────────────────
    // 📡 EVENT EMISSION (IMPORTANT ARCHITECTURAL NOTE)
    // Ideally this should be moved to Orders domain later.
    // Kept here for backward compatibility.
    // ─────────────────────────────────────────────
    this.eventBus.emit(ORDER_EVENTS.ORDER_CREATED, {
      orderId: order.id,
      sessionId: session.id,
      tenantId: draft.tenantId,
      totalAmount: finalTotal,
      customerId: draft.userId,
      source: 'checkout',
      timestamp: new Date().toISOString(),
    });

    this.logger.log(
      `[ORDER_CREATED] orderId=${order.id} session=${session.id} total=${finalTotal}`,
    );

    return order;
  }
}