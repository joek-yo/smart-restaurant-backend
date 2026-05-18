// src/modules/orders/infrastructure/persistence/postgres/entities/order-item.typeorm-entity.ts

import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrderTypeormEntity } from './order.typeorm-entity';

@Entity('order_items')
export class OrderItemTypeormEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => OrderTypeormEntity, (order) => order.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order!: OrderTypeormEntity;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId!: string;

  @Column({ name: 'product_id', type: 'varchar', length: 128 })
  productId!: string;

  @Column({ name: 'name', type: 'varchar', length: 256 })
  name!: string;

  @Column({ name: 'quantity', type: 'int' })
  quantity!: number;

  @Column({ name: 'price', type: 'numeric', precision: 12, scale: 2 })
  price!: number;

  @Column({ name: 'total', type: 'numeric', precision: 12, scale: 2 })
  total!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
