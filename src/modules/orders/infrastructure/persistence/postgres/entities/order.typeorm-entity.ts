// src/modules/orders/infrastructure/persistence/postgres/entities/order.typeorm-entity.ts

import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderStatus } from '@modules/orders/domain/entities/order-status.enum';
import { OrderItemTypeormEntity } from './order-item.typeorm-entity';

@Entity('orders')
export class OrderTypeormEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'varchar', length: 128 })
  tenantId!: string;

  @Column({ name: 'session_id', type: 'varchar', length: 128, nullable: true, unique: true })
  sessionId!: string | null;

  @Column({ name: 'customer_id', type: 'varchar', length: 128 })
  customerId!: string;

  @Column({ name: 'customer_name', type: 'varchar', length: 256 })
  customerName!: string;

  @Column({ name: 'customer_phone', type: 'varchar', length: 64, nullable: true })
  customerPhone!: string | null;

  @Column({ name: 'branch_id', type: 'varchar', length: 128, nullable: true })
  branchId!: string | null;

  @Column({ name: 'source', type: 'varchar', length: 64, nullable: true })
  source!: string | null;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes!: string | null;

  @Column({
    name: 'status',
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status!: OrderStatus;

  @Column({ name: 'total_amount', type: 'numeric', precision: 12, scale: 2, default: 0 })
  totalAmount!: number;

  @Column({ name: 'queue_number', type: 'int', default: 0 })
  queueNumber!: number;

  @OneToMany(() => OrderItemTypeormEntity, (item) => item.order, {
    cascade: true,
    eager: true,
  })
  items!: OrderItemTypeormEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
