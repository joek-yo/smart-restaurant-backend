import { Injectable } from '@nestjs/common';
import { OrderRepository } from '@modules/orders/domain/repositories/order.repository';
import { Order } from '@modules/orders/domain/entities/order.entity';
import { OrderTypeormRepository } from '../persistence/postgres/order.typeorm.repository';
import { OrderTypeormMapper } from '../persistence/postgres/mappers/order.typeorm.mapper';

@Injectable()
export class OrderRepositoryImpl implements OrderRepository {
  constructor(private readonly pg: OrderTypeormRepository) {}

  async create(order: Order): Promise<Order> {
    const entity = OrderTypeormMapper.toPersistence(order);
    const saved = await this.pg.save(entity);
    return OrderTypeormMapper.toDomain(saved);
  }

  async findById(id: string): Promise<Order | null> {
    const row = await this.pg.findById(id);
    return row ? OrderTypeormMapper.toDomain(row) : null;
  }

  async findBySessionId(sessionId: string): Promise<Order | null> {
    const row = await this.pg.findBySessionId(sessionId);
    return row ? OrderTypeormMapper.toDomain(row) : null;
  }

  async findByBusinessId(businessId: string): Promise<Order[]> {
    const rows = await this.pg.findByTenantId(businessId);
    return rows.map(OrderTypeormMapper.toDomain);
  }

  async update(id: string, partial: Partial<Order>): Promise<Order> {
    const current = await this.pg.findById(id);
    if (!current) throw new Error(`Order ${id} not found`);

    // Only update scalar columns — never re-save items (loses order_id FK)
    const updated = await this.pg.save_partial(id, {
      ...(partial.status !== undefined && { status: partial.status }),
      ...(partial.totalAmount !== undefined && { totalAmount: partial.totalAmount }),
      ...(partial.queueNumber !== undefined && { queueNumber: partial.queueNumber }),
      ...(partial.notes !== undefined && { notes: partial.notes }),
      ...(partial.customerName !== undefined && { customerName: partial.customerName }),
      ...(partial.customerPhone !== undefined && { customerPhone: partial.customerPhone }),
    });

    return OrderTypeormMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.pg.delete(id);
  }
}
