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
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await this.orderModel.findById(id).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async update(id: string, partial: Partial<Order>): Promise<Order> {
    const updateData: any = { ...partial };

    // Clean up ObjectIds for partial updates
    if (partial.businessId) updateData.businessId = new Types.ObjectId(partial.businessId);
    if (partial.branchId) updateData.branchId = new Types.ObjectId(partial.branchId);
    if (partial.customerId) updateData.customerId = new Types.ObjectId(partial.customerId);
    if (partial.items) {
      updateData.items = partial.items.map(i => ({
        ...i,
        productId: new Types.ObjectId(i.productId),
      }));
    }

    const updated = await this.orderModel.findByIdAndUpdate(
      id,
      { $set: updateData }, // Use $set for surgical partial updates
      { new: true },
    ).exec();

    if (!updated) throw new Error(`Order ${id} not found for update`);

    return this.toDomain(updated);
  }

  // ✅ NEW: Satisfies interface contract
  async delete(id: string): Promise<void> {
    await this.orderModel.findByIdAndDelete(id).exec();
  }

  // ✅ NEW: Satisfies interface contract
  async findByBusinessId(businessId: string): Promise<Order[]> {
    const docs = await this.orderModel.find({ 
      businessId: new Types.ObjectId(businessId) 
    }).exec();
    return docs.map(doc => this.toDomain(doc));
  }

  // ✅ NEW: Satisfies interface contract
  async findByUserId(userId: string): Promise<Order[]> {
    const docs = await this.orderModel.find({ 
      customerId: new Types.ObjectId(userId) 
    }).exec();
    return docs.map(doc => this.toDomain(doc));
  }

  // ✅ NEW: Satisfies optional status query
  async findByStatus(status: string): Promise<Order[]> {
    const docs = await this.orderModel.find({ status }).exec();
    return docs.map(doc => this.toDomain(doc));
  }

  private toDomain(doc: any): Order {
    return new Order({
      id: doc._id.toString(),
      businessId: doc.businessId.toString(),
      branchId: doc.branchId?.toString(),
      customerId: doc.customerId?.toString(),
      customerName: doc.customerName,
      customerPhone: doc.customerPhone,
      items: (doc.items || []).map((i: any) => ({
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