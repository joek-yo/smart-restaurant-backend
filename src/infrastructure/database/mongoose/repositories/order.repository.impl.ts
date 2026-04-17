// src/infrastructure/database/mongoose/repositories/order.repository.impl.ts

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { OrderRepository } from '../../../../domains/orders/repositories/order.repository';
import { Order } from '../../../../domains/orders/entities/order.entity';
import {
  Order as OrderSchema,
  OrderDocument as RawOrderDocument,
} from '../../../../domains/orders/schemas/order.schema';

type OrderDocument = RawOrderDocument;

@Injectable()
export class OrderRepositoryImpl implements OrderRepository {
  constructor(
    @InjectModel(OrderSchema.name)
    private readonly orderModel: Model<OrderDocument>,
  ) {}

  // =========================
  // CREATE
  // =========================
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
      .find({
        businessId: new Types.ObjectId(businessId),
      })
      .exec();

    return docs.map(doc => this.toDomain(doc));
  }

  // =========================
  // UPDATE
  // =========================
  async update(id: string, partial: Partial<Order>): Promise<Order> {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error(`Invalid order ID: ${id}`);
    }

    const updateData: Record<string, any> = {};

    if (partial.businessId)
      updateData.businessId = new Types.ObjectId(partial.businessId);

    if (partial.branchId)
      updateData.branchId = new Types.ObjectId(partial.branchId);

    if (partial.customerId)
      updateData.customerId = new Types.ObjectId(partial.customerId);

    if (partial.customerName)
      updateData.customerName = partial.customerName;

    if (partial.customerPhone)
      updateData.customerPhone = partial.customerPhone;

    if (partial.notes)
      updateData.notes = partial.notes;

    if (partial.source)
      updateData.source = partial.source;

    if (partial.status)
      updateData.status = partial.status;

    if (partial.items) {
      updateData.items = partial.items.map(i => ({
        productId: new Types.ObjectId(i.productId),
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        total: i.total,
      }));
    }

    const updated = await this.orderModel
      .findByIdAndUpdate(
        id,
        { $set: updateData },
        {
          returnDocument: 'after', // ✅ replaces deprecated { new: true }
        },
      )
      .exec();

    if (!updated) {
      throw new Error(`Order ${id} not found for update`);
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
  // DOMAIN MAPPING
  // =========================
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