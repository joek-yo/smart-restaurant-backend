// src/modules/orders/infrastructure/repositories/order.repository.impl.ts

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

// ✅ Domain Imports
import { OrderRepository } from '@modules/orders/domain/repositories/order.repository';
import { Order } from '@modules/orders/domain/entities/order.entity';
import { OrderStatus } from '@modules/orders/domain/entities/order-status.enum';

// ✅ Infrastructure Imports (Aligned with functional schema)
import {
  OrderDocument,
} from '@modules/orders/infrastructure/schemas/order.schema';

@Injectable()
export class OrderRepositoryImpl implements OrderRepository {
  constructor(
    // ✅ Use string 'Order' - must match the 'name' in MongooseModule.forFeature
    @InjectModel('Order')
    private readonly orderModel: Model<OrderDocument>,
  ) {}

  // =========================
  // CREATE
  // =========================
  async create(order: Order): Promise<Order> {
    const created = await this.orderModel.create({
      tenantId: order.tenantId, 
      items: order.items,
      status: order.status,
      queueNumber: order.queueNumber,
    });

    return this.toDomain(created);
  }

  // =========================
  // READ
  // =========================
  async findById(id: string): Promise<Order | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const doc = await this.orderModel.findById(id).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByBusinessId(businessId: string): Promise<Order[]> {
    const docs = await this.orderModel
      .find({ tenantId: businessId }) 
      .exec();

    return docs.map((doc) => this.toDomain(doc));
  }

  // =========================
  // UPDATE
  // =========================
  async update(id: string, partial: Partial<Order>): Promise<Order> {
    // If the partial includes businessId/tenantId, ensure they map correctly
    const updateData = { ...partial } as any;
    if (partial.tenantId) updateData.tenantId = partial.tenantId;

    const updated = await this.orderModel
      .findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new Error(`Order ${id} not found`);
    }

    return this.toDomain(updated);
  }

  // =========================
  // DELETE
  // =========================
  async delete(id: string): Promise<void> {
    await this.orderModel.findByIdAndDelete(id).exec();
  }

  // =========================
  // ✅ SAFE DOMAIN MAPPING
  // =========================
  private toDomain(doc: OrderDocument): Order {
    return new Order({
      id: doc._id.toString(),
      tenantId: doc.tenantId,
      items: doc.items,
      
      // Strict Enum Validation
      status: Object.values(OrderStatus).includes(doc.status as OrderStatus)
        ? (doc.status as OrderStatus)
        : OrderStatus.PENDING,

      queueNumber: doc.queueNumber,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}