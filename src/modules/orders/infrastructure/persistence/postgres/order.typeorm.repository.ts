// src/modules/orders/infrastructure/persistence/postgres/order.typeorm.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderTypeormEntity } from './entities/order.typeorm-entity';
import { OrderItemTypeormEntity } from './entities/order-item.typeorm-entity';

@Injectable()
export class OrderTypeormRepository {
  constructor(
    @InjectRepository(OrderTypeormEntity)
    private readonly orderRepo: Repository<OrderTypeormEntity>,

    @InjectRepository(OrderItemTypeormEntity)
    private readonly itemRepo: Repository<OrderItemTypeormEntity>,
  ) {}

  async save(entity: OrderTypeormEntity): Promise<OrderTypeormEntity> {
    return this.orderRepo.save(entity);
  }

  async findById(id: string): Promise<OrderTypeormEntity | null> {
    return this.orderRepo.findOne({ where: { id }, relations: ['items'] });
  }

  async findBySessionId(sessionId: string): Promise<OrderTypeormEntity | null> {
    return this.orderRepo.findOne({ where: { sessionId }, relations: ['items'] });
  }

  async findByTenantId(tenantId: string): Promise<OrderTypeormEntity[]> {
    return this.orderRepo.find({
      where: { tenantId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
  }

  async save_partial(id: string, partial: Partial<OrderTypeormEntity>): Promise<OrderTypeormEntity | null> {
    await this.orderRepo.update({ id }, partial);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.orderRepo.delete({ id });
  }
}
