// src/modules/orders/orders.service.ts

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { OrderDocument } from './infrastructure/schemas/order.schema';
import { CreateOrderDto } from './application/dto/create-order.dto';
import { UpdateOrderStatusDto } from './application/dto/update-order-status.dto';
import { EventBus } from '@core/events';
import { ORDER_EVENTS } from '@core/events/event.constants';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel('Order')
    private readonly orderModel: Model<OrderDocument>,
    private readonly eventBus: EventBus,
  ) {}

  async create(dto: CreateOrderDto) {
    const tenantId = Types.ObjectId.isValid(dto.businessId)
      ? new Types.ObjectId(dto.businessId).toString()
      : dto.businessId;

    const order = await this.orderModel.create({
      tenantId,
      items: dto.items,
      status: 'PENDING',
      queueNumber: Date.now(),
    });

    const orderId = (order._id as any).toString();

    this.eventBus.emit(ORDER_EVENTS.ORDER_CREATED, {
      orderId,
      businessId: dto.businessId,
    });

    return order;
  }

  async findAll(businessId: string) {
    return this.orderModel
      .find({ tenantId: businessId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string) {
    return this.orderModel.findById(id).exec();
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    return this.orderModel
      .findByIdAndUpdate(id, { $set: { status: dto.status } }, { new: true })
      .exec();
  }

  async markAsCompleted(orderId: string) {
    const order = await this.orderModel
      .findByIdAndUpdate(orderId, { status: 'COMPLETED' }, { new: true })
      .exec();

    if (!order) return null;

    this.eventBus.emit(ORDER_EVENTS.ORDER_COMPLETED, { orderId });
    return order;
  }

  async cancelOrder(orderId: string) {
    const order = await this.orderModel
      .findByIdAndUpdate(orderId, { status: 'CANCELLED' }, { new: true })
      .exec();

    if (!order) return null;

    this.eventBus.emit(ORDER_EVENTS.ORDER_CANCELLED, { orderId });
    return order;
  }

  async remove(id: string) {
    return this.orderModel.findByIdAndDelete(id).exec();
  }
}
