// src/modules/orders/application/services/order-domain.service.ts

import { Injectable } from '@nestjs/common';
import { Order } from '@modules/orders/domain/entities/order.entity';
import { OrderStatus } from '@modules/orders/domain/entities/order-status.enum';

/**
 * OrderDomainService
 * ------------------
 * Central authority for ALL order business rules.
 *
 * RULE:
 * - Use cases orchestrate
 * - Repository persists
 * - THIS service decides if actions are allowed
 */

@Injectable()
export class OrderDomainService {
  // ─────────────────────────────────────────────
  // 🔒 VALIDATE STATUS TRANSITIONS
  // ─────────────────────────────────────────────
  canTransition(
    current: OrderStatus,
    next: OrderStatus,
  ): boolean {
    const rules: Partial<Record<OrderStatus, OrderStatus[]>> = {
      [OrderStatus.PENDING]: [
        OrderStatus.PREPARING,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.PREPARING]: [
        OrderStatus.COMPLETED,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.COMPLETED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    return rules[current]?.includes(next) ?? false;
  }

  // ─────────────────────────────────────────────
  // 🔒 CHECK IF ORDER IS MODIFIABLE
  // ─────────────────────────────────────────────
  isModifiable(order: Order): boolean {
    return order.status === OrderStatus.PENDING;
  }

  // ─────────────────────────────────────────────
  // 🔒 CHECK IF ORDER CAN BE CANCELLED
  // ─────────────────────────────────────────────
  canCancel(order: Order): boolean {
    return (
      order.status === OrderStatus.PENDING ||
      order.status === OrderStatus.PREPARING
    );
  }

  // ─────────────────────────────────────────────
  // 🔒 CHECK IF ORDER IS FINAL STATE
  // ─────────────────────────────────────────────
  isFinalState(status: OrderStatus): boolean {
    return (
      status === OrderStatus.COMPLETED ||
      status === OrderStatus.CANCELLED
    );
  }

  // ─────────────────────────────────────────────
  // 🔒 VALIDATE ORDER FOR PAYMENT
  // ─────────────────────────────────────────────
  validateForPayment(order: Order): void {
    if (!order.items || order.items.length === 0) {
      throw new Error('Order has no items');
    }

    if (order.totalAmount <= 0) {
      throw new Error('Invalid order total');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new Error('Order is not in a payable state');
    }
  }

  // ─────────────────────────────────────────────
  // 🔒 ENSURE SAFE STATE BEFORE UPDATE
  // ─────────────────────────────────────────────
  assertCanUpdateStatus(order: Order, next: OrderStatus): void {
    if (!this.canTransition(order.status, next)) {
      throw new Error(
        `Invalid transition: ${order.status} → ${next}`,
      );
    }
  }
}