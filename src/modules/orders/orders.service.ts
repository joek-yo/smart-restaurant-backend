// 📁 File: src/modules/orders/orders.service.ts

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

// 🧱 SCHEMA
import { Order, OrderDocument } from './schemas/order.schema';

// 📦 DTOs (adjust paths if needed)
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

// 🔥 EVENT BUS
import { EventBus, EVENTS } from '@core/events';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,

    // ✅ EVENT BUS INJECTION
    private readonly eventBus: EventBus,
  ) {}

  /* =====================================================
     CREATE ORDER
  ===================================================== */

  async create(dto: CreateOrderDto) {
    const order = await this.orderModel.create({
      ...dto,
      businessId: Types.ObjectId.isValid(dto.businessId)
        ? new Types.ObjectId(dto.businessId)
        : dto.businessId,
    });

    // 🔥 NORMALIZE ID
    const orderId = (order as any)?._id?.toString?.();

    // 🔥 EMIT EVENT
    this.eventBus.emit(EVENTS.ORDER_CREATED, {
      orderId,
      businessId: dto.businessId,
      totalAmount: order.totalAmount,
    });

    return order;
  }

  /* =====================================================
     GET ORDERS
  ===================================================== */

  async findAll(businessId: string) {
    return this.orderModel
      .find({
        businessId: Types.ObjectId.isValid(businessId)
          ? new Types.ObjectId(businessId)
          : businessId,
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string) {
    return this.orderModel.findById(id).exec();
  }

  /* =====================================================
     UPDATE ORDER
  ===================================================== */

  async update(id: string, dto: UpdateOrderDto) {
    const order = await this.orderModel.findByIdAndUpdate(
      id,
      { $set: dto },
      { new: true },
    );

    if (!order) return null;

    return order;
  }

  /* =====================================================
     COMPLETE ORDER
  ===================================================== */

  async markAsCompleted(orderId: string) {
    const order = await this.orderModel.findByIdAndUpdate(
      orderId,
      { status: 'completed' },
      { new: true },
    );

    if (!order) return null;

    this.eventBus.emit(EVENTS.ORDER_COMPLETED, {
      orderId,
      businessId: order.businessId,
    });

    return order;
  }

  /* =====================================================
     CANCEL ORDER
  ===================================================== */

  async cancelOrder(orderId: string) {
    const order = await this.orderModel.findByIdAndUpdate(
      orderId,
      { status: 'cancelled' },
      { new: true },
    );

    if (!order) return null;

    this.eventBus.emit(EVENTS.ORDER_CANCELLED, {
      orderId,
      businessId: order.businessId,
    });

    return order;
  }

  /* =====================================================
     DELETE ORDER
  ===================================================== */

  async remove(id: string) {
    return this.orderModel.findByIdAndDelete(id).exec();
  }
}