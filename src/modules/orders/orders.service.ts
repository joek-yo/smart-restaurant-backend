// src/modules/orders/orders.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { startOfDay } from 'date-fns';

import { Order, OrderDocument } from './schemas/order.schema';
import { Product, ProductDocument } from '../menu/schemas/product.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from './schemas/order-status.enum';
import { OrdersGateway } from './orders.gateway';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,

    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,

    private readonly ordersGateway: OrdersGateway,
  ) {}

  /** Generate next queue number (resets daily) */
  async generateQueueNumber(restaurantId: string): Promise<number> {
    const today = startOfDay(new Date());

    const lastOrder = await this.orderModel
      .findOne({
        restaurant_id: new Types.ObjectId(restaurantId),
        createdAt: { $gte: today },
      })
      .sort({ queue_number: -1 })
      .exec();

    return lastOrder ? lastOrder.queue_number + 1 : 1;
  }

  /** Create a new order safely with type-guarded products */
  async createOrder(
    restaurantId: string,
    dto: CreateOrderDto,
  ): Promise<Order> {
    let totalAmount = 0;
    const orderItems = [];

    const queue_number = await this.generateQueueNumber(restaurantId);

    for (const item of dto.items) {
      const product = await this.productModel.findById(item.product_id);

      if (!product) {
        throw new NotFoundException(`Product not found: ${item.product_id}`);
      }

      // Ensure product belongs to this restaurant
      if (product.restaurant_id.toString() !== restaurantId) {
        throw new BadRequestException(`Product does not belong to this restaurant`);
      }

      // Deduct stock if applicable
      if (typeof product.stock === 'number') {
        if (product.stock < item.quantity) {
          throw new BadRequestException(`Not enough stock for ${product.name}`);
        }

        product.stock -= item.quantity;

        if (product.stock <= 0) product.is_out_of_stock = true;

        await product.save();
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      // Snapshot item data
      orderItems.push({
        product_id: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        total: itemTotal,
      });
    }

    const order = await this.orderModel.create({
      restaurant_id: new Types.ObjectId(restaurantId),
      customer_name: dto.customer_name,
      customer_phone: dto.customer_phone,
      items: orderItems,
      total_amount: totalAmount,
      status: OrderStatus.PENDING,
      queue_number,
      notes: dto.notes || '',
    });

    // Emit WebSocket event
    this.ordersGateway.emitOrderCreated(order);

    return order;
  }

  /** Update order status safely */
  async updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<Order | null> {
    if (!Object.values(OrderStatus).includes(newStatus)) {
      throw new BadRequestException(`Invalid order status: ${newStatus}`);
    }

    const order = await this.orderModel.findById(orderId);
    if (!order) return null;

    order.status = newStatus;
    return order.save();
  }

  /** Convenience methods */
  async acceptOrder(orderId: string) {
    return this.updateOrderStatus(orderId, OrderStatus.ACCEPTED);
  }

  async startPreparing(orderId: string) {
    return this.updateOrderStatus(orderId, OrderStatus.PREPARING);
  }

  async markReady(orderId: string) {
    return this.updateOrderStatus(orderId, OrderStatus.READY);
  }

  async completeOrder(orderId: string) {
    return this.updateOrderStatus(orderId, OrderStatus.COMPLETED);
  }

  async cancelOrder(orderId: string) {
    return this.updateOrderStatus(orderId, OrderStatus.CANCELLED);
  }
}