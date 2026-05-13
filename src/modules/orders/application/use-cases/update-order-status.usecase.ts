// src/modules/orders/application/use-cases/update-order-status.usecase.ts

import { Injectable, Inject, Logger } from '@nestjs/common';

import { ORDER_REPOSITORY } from '@modules/orders/domain/repositories/order.tokens';
import { OrderRepository } from '@modules/orders/domain/repositories/order.repository';
import { Order } from '@modules/orders/domain/entities/order.entity';
import { OrderStatus } from '@modules/orders/domain/entities/order-status.enum';

import { EventBus } from '@core/events';
import { ORDER_EVENTS } from '@core/events/event.constants';

/**
 * PURPOSE:
 * Safe order state transition handler with:
 * - transition guards
 * - idempotency safety
 * - event hardening
 * - no duplicate side effects
 */

@Injectable()
export class UpdateOrderStatusUseCase {
  private readonly logger = new Logger(UpdateOrderStatusUseCase.name);

  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepo: OrderRepository,

    private readonly eventBus: EventBus,
  ) {}

  async execute(orderId: string, nextStatus: OrderStatus): Promise<Order> {
    const order = await this.orderRepo.findById(orderId);

    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    // ─────────────────────────────────────────────
    // 🔒 IDENTITY GUARD (IDEMPOTENCY)
    // ─────────────────────────────────────────────
    if (order.status === nextStatus) {
      this.logger.warn(
        `[IDEMPOTENT] Order ${orderId} already in status ${nextStatus}`,
      );
      return order;
    }

    // ─────────────────────────────────────────────
    // 🔒 TRANSITION GUARD (VALID STATE FLOW)
    // ─────────────────────────────────────────────
    const isValidTransition = this.isValidTransition(
      order.status,
      nextStatus,
    );

    if (!isValidTransition) {
      throw new Error(
        `Invalid status transition: ${order.status} → ${nextStatus}`,
      );
    }

    // ─────────────────────────────────────────────
    // 🧠 DOMAIN UPDATE
    // ─────────────────────────────────────────────
    order.updateStatus(nextStatus);

    const updated = await this.orderRepo.update(orderId, order);

    // ─────────────────────────────────────────────
    // 🔥 EVENT HARDENING (NO DUPLICATES, NO SIDE EFFECT CHAOS)
    // ─────────────────────────────────────────────
    const baseEventPayload = {
      orderId,
      businessId: order.businessId,
      previousStatus: order.status,
      newStatus: nextStatus,
      timestamp: new Date().toISOString(),
    };

    switch (nextStatus) {
      case OrderStatus.COMPLETED:
        this.eventBus.emit(ORDER_EVENTS.ORDER_COMPLETED, baseEventPayload);
        break;

      case OrderStatus.CANCELLED:
        this.eventBus.emit(ORDER_EVENTS.ORDER_CANCELLED, baseEventPayload);
        break;

      default:
        // no-op for other transitions
        break;
    }

    this.logger.log(
      `[ORDER_STATUS_UPDATED] orderId=${orderId} ${order.status} → ${nextStatus}`,
    );

    return updated;
  }

  // ─────────────────────────────────────────────
  // 🔒 TRANSITION RULES (SIMPLE STATE MACHINE GUARD)
  // ─────────────────────────────────────────────
  private isValidTransition(
    current: OrderStatus,
    next: OrderStatus,
  ): boolean {
    const allowed: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [
        OrderStatus.ACCEPTED,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.ACCEPTED]: [
        OrderStatus.PREPARING,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.PREPARING]: [
        OrderStatus.READY,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.READY]: [
        OrderStatus.COMPLETED,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.COMPLETED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    return allowed[current]?.includes(next) ?? false;
  }
}