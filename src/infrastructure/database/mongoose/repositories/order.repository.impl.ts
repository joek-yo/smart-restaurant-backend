// src/infrastructure/database/mongoose/repositories/order.repository.impl.ts

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, Document } from 'mongoose';

import { OrderRepository } from '../../../../domains/orders/repositories/order.repository';
import { Order } from '../../../../domains/orders/entities/order.entity';
import { Order as OrderSchema, OrderDocument as RawOrderDocument } from '../../../../domains/orders/schemas/order.schema';

export type OrderDocument = RawOrderDocument & Document & {
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class OrderRepositoryImpl implements OrderRepository {
  constructor(
    @InjectModel(OrderSchema.name)
    private readonly orderModel: Model<OrderDocument>,
  ) {}

  async create(order: Order): Promise<Order> {
    const created = await this.orderModel.create({
      businessId: new Types.ObjectId(order.businessId),
      branchId: order.branchId ? new Types.ObjectId(order.branchId) : undefined,
      customerId: order.customerId ? new Types.ObjectId(order.customerId) : undefined,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      items: order.items.map(i => ({
        productId: new Types.ObjectId(i.productId),
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        total: i.total,
      })),
      totalAmount: order.totalAmount,
      status: order.status,
      queueNumber: order.queueNumber,
      notes: order.notes,
      source: order.source,
    });

    return this.toDomain(created);
  }

  async findById(id: string): Promise<Order | null> {
    const doc = await this.orderModel.findById(id).exec();
    return doc ? this.toDomain(doc) : null;
  }

  // ✅ ADD THIS METHOD
  async update(id: string, partial: Partial<Order>): Promise<Order> {
    const updated = await this.orderModel.findByIdAndUpdate(
      id,
      {
        ...partial,
        businessId: partial.businessId
          ? new Types.ObjectId(partial.businessId)
          : undefined,
        branchId: partial.branchId
          ? new Types.ObjectId(partial.branchId)
          : undefined,
        customerId: partial.customerId
          ? new Types.ObjectId(partial.customerId)
          : undefined,
        items: partial.items?.map(i => ({
          ...i,
          productId: new Types.ObjectId(i.productId),
        })),
      },
      { new: true },
    );

    if (!updated) throw new Error('Order not found');

    return this.toDomain(updated);
  }

  private toDomain(doc: any): Order {
    return new Order({
      id: doc._id.toString(),
      businessId: doc.businessId.toString(),
      branchId: doc.branchId?.toString(),
      customerId: doc.customerId?.toString(),
      customerName: doc.customerName,
      customerPhone: doc.customerPhone,
      items: doc.items.map((i: any) => ({
        productId: i.productId.toString(),
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        total: i.total,
      })),
      totalAmount: doc.totalAmount,
      status: doc.status,
      queueNumber: doc.queueNumber,
      notes: doc.notes,
      source: doc.source,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}