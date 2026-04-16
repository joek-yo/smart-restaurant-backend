// src/domains/orders/services/order.service.ts

import { Injectable } from '@nestjs/common';
import { Order } from '../entities/order.entity';
import { OrderStatus } from '../entities/order-status.enum';
import { OrderRepository } from '../repositories/order.repository';

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepo: OrderRepository,
  ) {}

  // =========================
  // CREATE ORDER FROM SESSION
  // =========================
  async createOrderFromSession(session: any): Promise<Order> {
    const order = Order.fromSession(session);

    // Generate queue number (simple MVP logic)
    order.queueNumber = Date.now(); // replace later with proper queue system

    const saved = await this.orderRepo.create(order);

    return saved;
  }

  // =========================
  // GET ORDER BY ID
  // =========================
  async getOrderById(orderId: string): Promise<Order | null> {
    return this.orderRepo.findById(orderId);
  }

  // =========================
  // GET USER ORDERS
  // =========================
  async getUserOrders(userId: string): Promise<Order[]> {
    return this.orderRepo.findByUserId(userId);
  }

  // =========================
  // UPDATE ORDER STATUS
  // =========================
  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
  ): Promise<Order> {
    const order = await this.orderRepo.findById(orderId);

    if (!order) {
      throw new Error('Order not found');
    }

    order.updateStatus(status);

    return this.orderRepo.update(order);
  }
}