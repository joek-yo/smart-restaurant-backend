// src/modules/orders/application/use-cases/cancel-order.use-case.ts

import { Injectable, Inject, Logger } from '@nestjs/common';

import { OrderStatus } from '../../domain/entities/order-status.enum';
import { OrderRepository } from '../../domain/repositories/order.repository';
import { ORDER_REPOSITORY } from '../../domain/repositories/order.tokens';

@Injectable()
export class CancelOrderUseCase {
  private readonly logger = new Logger(CancelOrderUseCase.name);

  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepo: OrderRepository,
  ) {}

  /**
   * Cancel an existing order
   * ------------------------
   * RULES:
   * ❌ No payment handling here
   * ❌ No session or checkout logic
   * ❌ No event emission (handled elsewhere if needed)
   *
   * ONLY responsibility:
   * → validate order state
   * → update status
   * → persist
   */
  async execute(input: {
    orderId: string;
    reason?: string;
    requestedBy?: string;
  }) {
    // ─────────────────────────────────────────────
    // 1. LOAD ORDER
    // ─────────────────────────────────────────────
    const order = await this.orderRepo.findById(input.orderId);

    if (!order) {
      throw new Error(`Order not found: ${input.orderId}`);
    }

    // ─────────────────────────────────────────────
    // 2. GUARD: prevent invalid cancellations
    // ─────────────────────────────────────────────
    if (order.status === OrderStatus.CANCELLED) {
      this.logger.warn(
        `[IDEMPOTENT] order already cancelled id=${input.orderId}`,
      );
      return order;
    }

    if (order.status === OrderStatus.COMPLETED) {
      throw new Error('Cannot cancel a completed order');
    }

    // ─────────────────────────────────────────────
    // 3. APPLY STATE CHANGE
    // ─────────────────────────────────────────────
    order.status = OrderStatus.CANCELLED as any;

    // optional metadata (safe to store)
    (order as any).cancellationReason = input.reason ?? 'unspecified';
    (order as any).cancelledBy = input.requestedBy ?? 'system';
    (order as any).cancelledAt = new Date();

    // ─────────────────────────────────────────────
    // 4. PERSIST
    // ─────────────────────────────────────────────
    const updated = await this.orderRepo.update(order.id!, order);

    this.logger.log(
      `[ORDER_CANCELLED] id=${order.id} reason=${input.reason ?? 'none'}`,
    );

    return updated;
  }
}