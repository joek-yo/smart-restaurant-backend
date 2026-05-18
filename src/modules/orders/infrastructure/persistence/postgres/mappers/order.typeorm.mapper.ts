// src/modules/orders/infrastructure/persistence/postgres/mappers/order.typeorm.mapper.ts

import { Order, OrderItem } from '@modules/orders/domain/entities/order.entity';
import { OrderTypeormEntity } from '../entities/order.typeorm-entity';
import { OrderItemTypeormEntity } from '../entities/order-item.typeorm-entity';

export class OrderTypeormMapper {
  static toDomain(row: OrderTypeormEntity): Order {
    const order = new Order({
      id: row.id,
      tenantId: row.tenantId,
      customerId: row.customerId,
      customerName: row.customerName,
      customerPhone: row.customerPhone ?? undefined,
      branchId: row.branchId ?? undefined,
      source: row.source ?? undefined,
      notes: row.notes ?? undefined,
      status: row.status,
      queueNumber: row.queueNumber,
      items: (row.items ?? []).map(OrderTypeormMapper.itemToDomain),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });

    if (row.sessionId) (order as any).sessionId = row.sessionId;

    return order;
  }

  static toPersistence(order: Order): OrderTypeormEntity {
    const entity = new OrderTypeormEntity();

    if (order.id) entity.id = order.id;
    entity.tenantId = order.tenantId;
    entity.sessionId = (order as any).sessionId ?? null;
    entity.customerId = order.customerId;
    entity.customerName = order.customerName;
    entity.customerPhone = order.customerPhone ?? null;
    entity.branchId = order.branchId ?? null;
    entity.source = order.source ?? null;
    entity.notes = order.notes ?? null;
    entity.status = order.status;
    entity.totalAmount = order.totalAmount;
    entity.queueNumber = order.queueNumber;
    entity.items = (order.items ?? []).map(OrderTypeormMapper.itemToPersistence);

    return entity;
  }

  private static itemToDomain(row: OrderItemTypeormEntity): OrderItem {
    return {
      productId: row.productId,
      name: row.name,
      quantity: row.quantity,
      price: Number(row.price),
      total: Number(row.total),
    };
  }

  private static itemToPersistence(item: OrderItem): OrderItemTypeormEntity {
    const entity = new OrderItemTypeormEntity();
    entity.productId = item.productId;
    entity.name = item.name;
    entity.quantity = item.quantity;
    entity.price = item.price;
    entity.total = item.total;
    return entity;
  }
}
