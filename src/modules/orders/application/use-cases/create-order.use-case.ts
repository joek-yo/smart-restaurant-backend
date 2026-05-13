// src/modules/orders/application/use-cases/create-order.use-case.ts

import { Injectable, Inject, Logger } from '@nestjs/common';

import { Order } from '../../domain/entities/order.entity';
import { OrderStatus } from '../../domain/entities/order-status.enum';
import { OrderRepository } from '../../domain/repositories/order.repository';
import { ORDER_REPOSITORY } from '../../domain/repositories/order.tokens';

@Injectable()
export class CreateOrderUseCase {
  private readonly logger = new Logger(CreateOrderUseCase.name);

  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepo: OrderRepository,
  ) {}

  /**
   * Canonical order creation entry point
   * ------------------------------------
   * RULES:
   * ❌ No session logic
   * ❌ No checkout logic
   * ❌ No event emission (handled by domain/event layer)
   *
   * ONLY responsibility:
   * → validate
   * → persist
   * → enforce idempotency
   */
  async execute(input: {
    tenantId: string;
    customerId: string;
    sessionId: string;
    items: any[];
    totalAmount: number;
    source?: string;
  }): Promise<Order> {
    // ─────────────────────────────────────────────
    // 1. IDENTITY / IDEMPOTENCY GUARD
    // ─────────────────────────────────────────────
    const existing = await this.orderRepo.findBySessionId(input.sessionId);

    if (existing) {
      this.logger.warn(
        `[IDEMPOTENT] order already exists sessionId=${input.sessionId}`,
      );
      return existing;
    }

    // ─────────────────────────────────────────────
    // 2. BASIC VALIDATION
    // ─────────────────────────────────────────────
    if (!input.items || input.items.length === 0) {
      throw new Error('Cannot create order with empty items');
    }

    if (input.totalAmount <= 0) {
      throw new Error('Invalid order total amount');
    }

    // ─────────────────────────────────────────────
    // 3. BUILD ORDER DOMAIN ENTITY
    // ─────────────────────────────────────────────
    const order = new Order({
      tenantId: input.tenantId,
      customerId: input.customerId,
      items: input.items,
      totalAmount: input.totalAmount,
      status: OrderStatus.PENDING,
      source: input.source ?? 'checkout',
    });

    // attach session link for traceability + idempotency
    (order as any).sessionId = input.sessionId;

    // ─────────────────────────────────────────────
    // 4. PERSIST
    // ─────────────────────────────────────────────
    const saved = await this.orderRepo.create(order);

    if (!saved.id) {
      this.logger.error('[ORDER_CREATE_FAILED] missing ID after persistence');
      throw new Error('Order creation failed');
    }

    this.logger.log(
      `[ORDER_CREATED] id=${saved.id} tenant=${input.tenantId} session=${input.sessionId}`,
    );

    return saved;
  }
}